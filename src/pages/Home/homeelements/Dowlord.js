const downloadFile = (fileUrl, fileName) => {
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = fileName || "file"; // You can give a custom name
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
export default downloadFile;