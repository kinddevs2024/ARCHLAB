import { Action } from "../components/Button";
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api, apiMessage } from "../api/client";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
const Context = createContext(null);
const mediaError = (e) =>
  e.name === "NotAllowedError"
    ? "Mikrofon yoki kameraga ruxsat berilmadi"
    : e.name === "NotFoundError"
      ? "Mikrofon yoki kamera topilmadi"
      : apiMessage(e, "Qo'ng'iroqni ulash imkoni bo'lmadi");
function Media({ stream, muted = false, video = false }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return video ? (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className="call-video"
    />
  ) : (
    <audio
      ref={ref}
      autoPlay
      muted={muted}
      controls={!muted}
      aria-label="Suhbatdoshingiz ovozi"
    />
  );
}
export function RealtimeProvider({ user, children }) {
  const [socket, setSocket] = useState(null),
    [connected, setConnected] = useState(false),
    [call, setCall] = useState(null),
    [local, setLocal] = useState(null),
    [remote, setRemote] = useState(null),
    [error, setError] = useState(""),
    [mic, setMic] = useState(true),
    [camera, setCamera] = useState(true),
    actions = useRef({});
  useEffect(() => {
    if (!user?.id) return;
    const s = io(import.meta.env.VITE_API_URL || undefined, {
      path: "/api/socket.io",
      transports: ["polling"],
      withCredentials: true,
    });
    setSocket(s);
    let current = null,
      peer = null,
      stream = null,
      pending = [],
      signalQueue = Promise.resolve(),
      disposed = false,
      generation = 0;
    const clean = () => {
      generation++;
      current = null;
      peer?.close();
      peer = null;
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      pending = [];
      setCall(null);
      setLocal(null);
      setRemote(null);
      setMic(true);
      setCamera(true);
    };
    const finish = (message = "") => {
      if (current?.id) s.emit("call:end", { id: current.id });
      clean();
      if (message) setError(message);
    };
    const update = (v) => {
      current = { ...current, ...v };
      setCall(current);
    };
    const request = (event, payload) =>
      new Promise((resolve, reject) =>
        s
          .timeout(10000)
          .emit(event, payload, (err, result) =>
            err
              ? reject(new Error("Aloqa vaqti tugadi"))
              : result?.ok
                ? resolve(result)
                : reject(
                    new Error(
                      result?.message || "Qo'ng'iroqni ulash imkoni bo'lmadi",
                    ),
                  ),
          ),
      );
    const getMedia = async (video) => {
      const started = generation;
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("Brauzer mikrofonni qo'llab-quvvatlamaydi");
      const next = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video
          ? { width: { ideal: 640 }, height: { ideal: 480 } }
          : false,
      });
      if (disposed || started !== generation) {
        next.getTracks().forEach((t) => t.stop());
        throw new DOMException("Aloqa yopildi", "AbortError");
      }
      stream = next;
      setLocal(stream);
    };
    const makePeer = async () => {
      if (peer) return peer;
      const id = current?.id,
        started = generation,
        { data } = await api.get("/api/chat/ice");
      if (!current || current.id !== id || started !== generation || !stream)
        throw new DOMException("Qo'ng'iroq yakunlandi", "AbortError");
      peer = new RTCPeerConnection({ iceServers: data.iceServers });
      stream.getTracks().forEach((t) => peer.addTrack(t, stream));
      peer.onicecandidate = (e) => {
        if (e.candidate && current?.id)
          s.emit("call:signal", {
            id: current.id,
            signal: { candidate: e.candidate.toJSON() },
          });
      };
      peer.ontrack = (e) =>
        setRemote(e.streams[0] || new MediaStream([e.track]));
      peer.onconnectionstatechange = () => {
        if (peer?.connectionState === "connected") update({ status: "active" });
        if (peer?.connectionState === "failed")
          finish("Qo'ng'iroq aloqasi uzildi. Qayta urinib ko'ring.");
      };
      return peer;
    };
    s.on("connect", () => {
      setConnected(true);
      setError("");
    });
    s.on("disconnect", () => {
      setConnected(false);
      clean();
    });
    s.on("connect_error", () => setConnected(false));
    s.on("call:incoming", (payload) => {
      if (current) {
        s.emit("call:end", { id: payload.id });
        return;
      }
      current = {
        ...payload,
        status: "incoming",
        name: [payload.caller?.name, payload.caller?.surname]
          .filter(Boolean)
          .join(" "),
      };
      setCall(current);
      setError("");
    });
    s.on("call:accepted", async ({ id }) => {
      if (current?.id !== id) return;
      const started = generation;
      try {
        update({ status: "connecting" });
        const p = await makePeer();
        await p.setLocalDescription(await p.createOffer());
        s.emit("call:signal", {
          id,
          signal: { description: p.localDescription.toJSON() },
        });
      } catch (e) {
        if (started === generation && e.name !== "AbortError")
          finish(mediaError(e));
      }
    });
    s.on("call:answered_elsewhere", ({ id }) => {
      if (current?.id === id) clean();
    });
    s.on("call:signal", (payload) => {
      const started = generation;
      signalQueue = signalQueue
        .then(async () => {
          if (current?.id !== payload.id || started !== generation) return;
          const p = await makePeer();
          if (payload.signal.description) {
            await p.setRemoteDescription(payload.signal.description);
            for (const candidate of pending) await p.addIceCandidate(candidate);
            pending = [];
            if (payload.signal.description.type === "offer") {
              await p.setLocalDescription(await p.createAnswer());
              s.emit("call:signal", {
                id: current.id,
                signal: { description: p.localDescription.toJSON() },
              });
            }
          } else if (payload.signal.candidate) {
            if (p.remoteDescription)
              await p.addIceCandidate(payload.signal.candidate);
            else pending.push(payload.signal.candidate);
          }
        })
        .catch((e) => {
          if (started === generation && e.name !== "AbortError")
            finish(mediaError(e));
        });
    });
    s.on("call:ended", ({ id, reason }) => {
      if (current?.id === id) {
        clean();
        if (reason) setError(reason);
      }
    });
    actions.current = {
      start: async (conversation, target, video, name) => {
        if (current) return;
        if (!s.connected) {
          setError("Jonli aloqa hali ulanmagan. Qayta urinib ko'ring.");
          return;
        }
        setError("");
        const started = generation;
        update({ video, name, status: "preparing" });
        try {
          await getMedia(video);
          const result = await request("call:invite", {
            conversation,
            target,
            video,
          });
          if (disposed || started !== generation) {
            s.emit("call:end", { id: result.id });
            return;
          }
          update({ id: result.id, video, name, status: "ringing" });
        } catch (e) {
          if (started === generation && e.name !== "AbortError")
            finish(mediaError(e));
        }
      },
      accept: async () => {
        if (current?.status !== "incoming") return;
        const id = current.id,
          started = generation;
        try {
          update({ status: "connecting" });
          await getMedia(current.video);
          if (current?.id !== id || started !== generation) return;
          await makePeer();
          await request("call:accept", { id });
        } catch (e) {
          if (started === generation && e.name !== "AbortError")
            finish(mediaError(e));
        }
      },
      end: () => finish(),
      mute: () => {
        const next = !stream?.getAudioTracks()[0]?.enabled;
        stream?.getAudioTracks().forEach((t) => (t.enabled = next));
        setMic(next);
      },
      camera: () => {
        const next = !stream?.getVideoTracks()[0]?.enabled;
        stream?.getVideoTracks().forEach((t) => (t.enabled = next));
        setCamera(next);
      },
    };
    return () => {
      disposed = true;
      if (current?.id) s.emit("call:end", { id: current.id });
      s.disconnect();
      clean();
      setSocket(null);
    };
  }, [user?.id]);
  const value = {
    socket,
    connected,
    startCall: (...a) => actions.current.start?.(...a),
  };
  return (
    <Context.Provider value={value}>
      {children}
      {error && (
        <div role="alert" className="call-error">
          {error}
          <Action aria-label="Xabarni yopish" onClick={() => setError("")}>
            ×
          </Action>
        </div>
      )}
      <Modal
        open={!!call}
        title={call?.name || "Qo'ng'iroq"}
        onClose={() => actions.current.end?.()}
        size="wide"
      >
        <p role="status" className="mb-5">
          {call?.status === "incoming"
            ? "Kiruvchi qo'ng'iroq"
            : call?.status === "ringing"
              ? "Javob kutilmoqda..."
              : call?.status === "active"
                ? "Qo'ng'iroq ulandi"
                : "Ulanmoqda..."}
        </p>
        {call?.status !== "incoming" && (
          <div className="call-streams">
            <Media stream={remote} video={call?.video} />
            {local && <Media stream={local} muted video={call?.video} />}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          {call?.status === "incoming" ? (
            <Button onClick={() => actions.current.accept?.()}>
              Qabul qilish
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => actions.current.mute?.()}
              >
                {mic ? "Mikrofonni o'chirish" : "Mikrofonni yoqish"}
              </Button>
              {call?.video && (
                <Button
                  variant="secondary"
                  onClick={() => actions.current.camera?.()}
                >
                  {camera ? "Kamerani o'chirish" : "Kamerani yoqish"}
                </Button>
              )}
            </>
          )}
          <Button variant="danger" onClick={() => actions.current.end?.()}>
            {call?.status === "incoming" ? "Rad etish" : "Yakunlash"}
          </Button>
        </div>
      </Modal>
    </Context.Provider>
  );
}
export const useRealtime = () => useContext(Context);
