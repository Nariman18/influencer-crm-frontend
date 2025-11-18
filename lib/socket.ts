import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocketClient = (token?: string) => {
  if (socket) return socket;

  let url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SOCKET_URL is missing!");
  }

  // Normalize URL
  url = url.replace(/\/$/, ""); // remove trailing /
  url = url.replace(/\/socket\.io.*/, ""); // safety

  socket = io(url, {
    path: "/socket.io",
    transports: ["polling", "websocket"],
    upgrade: true,
    withCredentials: true,
    secure: url.startsWith("https://"),
    auth: { token },
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    timeout: 20000,
  });

  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket!.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("🔴 Socket connect_error:", err.message || err);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error("Socket not initialized");
  return socket;
};
