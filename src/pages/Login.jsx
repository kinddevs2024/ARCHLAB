import { useState } from "react";
import { Navigate } from "react-router-dom";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaMapMarkerAlt, FaPhoneAlt, FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const emptyRegister = {
  name: "",
  surname: "",
  phone: "",
  address: "",
  username: "",
  email: "",
  password: "",
};

function AuthField({ icon: Icon, className = "", ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = props.type === "password";

  return (
    <label className={`flex h-[50px] overflow-hidden rounded-[9px] border border-[#d6d6d6] bg-white transition focus-within:border-[#cdaa82] ${className}`}>
      <span className="flex w-[50px] shrink-0 items-center justify-center bg-[#cfab83] text-white">
        <Icon className="text-[15px]" />
      </span>
      <span className="relative flex min-w-0 flex-1">
        <input
          className={`min-w-0 flex-1 border-0 bg-white px-[14px] text-[16px] font-normal text-[#23243d] outline-none placeholder:text-[#9b9b9b] ${isPassword ? "pr-11" : ""}`}
          {...props}
          type={isPassword && visible ? "text" : props.type}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8d99] transition hover:text-[#cfab83]"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
          >
            {visible ? <FaEyeSlash /> : <FaEye />}
          </button>
        ) : null}
      </span>
    </label>
  );
}

export default function Login() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/projects" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const result = mode === "login" ? await login(form) : await register(registerForm);
    if (!result.ok) setMessage(result.message);
    setLoading(false);
  };

  const updateRegister = (event) => {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[50.8%_49.2%]">
        <section className="relative flex min-h-screen justify-center px-6 pb-[170px] pt-[92px] sm:px-10 lg:justify-start lg:pl-[138px] lg:pr-10">
          <img
            src="/Loginbg.png"
            alt=""
            className="pointer-events-none absolute bottom-0 left-0 z-0 h-[220px] w-full object-cover object-bottom opacity-100"
          />

          <div className="relative z-10 w-full max-w-[345px]">
            <header className="mb-[204px] flex items-center gap-[28px] max-lg:mb-20">
              <img src="/logo.svg" alt="ARCH LAB" className="h-[50px] w-[50px] rounded-xl" />
              <h1 className="whitespace-nowrap text-[30px] font-extrabold leading-none tracking-[-0.02em] text-[#282a45] max-sm:text-[24px]">
                ARCH LAB WOORKROOM
              </h1>
            </header>

            <div className="mb-[28px] flex rounded-[10px] bg-[#f7f4ef] p-1">
              <button
                type="button"
                className={`h-9 flex-1 rounded-[8px] text-[13px] font-bold transition ${mode === "login" ? "bg-[#cfab83] text-white" : "text-[#7b756f]"}`}
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
              >
                Kirish
              </button>
              <button
                type="button"
                className={`h-9 flex-1 rounded-[8px] text-[13px] font-bold transition ${mode === "register" ? "bg-[#cfab83] text-white" : "text-[#7b756f]"}`}
                onClick={() => {
                  setMode("register");
                  setMessage("");
                }}
              >
                Ro'yxat
              </button>
            </div>

            <h2 className="mb-[27px] text-[26px] font-extrabold leading-none text-black">
              {mode === "login" ? "Xush kelibsiz" : "Yangi profil"}
            </h2>
            {message ? (
              <div className="mb-4 rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {message}
              </div>
            ) : null}

            <form className={mode === "login" ? "space-y-[28px]" : "space-y-[14px]"} onSubmit={submit}>
            {mode === "login" ? (
              <>
                <AuthField icon={FaEnvelope} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} />
                <AuthField icon={FaLock} placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} />
                <label className="flex items-center gap-[15px] text-[14px] font-bold text-[#191919]">
                  <input className="h-[21px] w-[21px] accent-[#617be7]" type="checkbox" defaultChecked />
                  Eslab qolish
                </label>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                  <AuthField icon={FaUser} name="name" placeholder="Ism (ixtiyoriy)" value={registerForm.name} onChange={updateRegister} />
                  <AuthField icon={FaUser} name="surname" placeholder="Familiya (ixtiyoriy)" value={registerForm.surname} onChange={updateRegister} />
                </div>
                <AuthField icon={FaUser} name="username" placeholder="Username (ixtiyoriy)" value={registerForm.username} onChange={updateRegister} />
                <AuthField icon={FaPhoneAlt} name="phone" placeholder="Telefon (ixtiyoriy)" value={registerForm.phone} onChange={updateRegister} />
                <AuthField icon={FaMapMarkerAlt} name="address" placeholder="Manzil (ixtiyoriy)" value={registerForm.address} onChange={updateRegister} />
                <AuthField icon={FaEnvelope} name="email" placeholder="Email" type="email" required value={registerForm.email} onChange={updateRegister} />
                <AuthField icon={FaLock} name="password" placeholder="Password" type="password" required value={registerForm.password} onChange={updateRegister} />
              </>
            )}
            <button
              className="mt-[5px] h-[55px] w-full rounded-[9px] bg-[#cfab83] text-[16px] font-extrabold text-white shadow-[0_7px_16px_rgba(205,171,131,0.22)] transition hover:bg-[#bf9a6f] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              {loading ? "Yuklanmoqda..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
            </button>
          </form>
          </div>
        </section>

        <section className="hidden min-h-screen p-5 pl-0 lg:block">
          <img
            src="/building.png"
            alt="ARCH LAB building"
            className="h-[calc(100vh-40px)] min-h-[720px] w-full rounded-[30px] object-cover object-center"
          />
        </section>
      </div>
    </main>
  );
}
