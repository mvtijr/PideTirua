import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <img
        src="/logo-pidetirua.jpg"
        alt="Logo PideTirúa"
        className="h-24 w-24 rounded-full border-2 border-outline-variant/40 bg-white object-contain shadow-md"
      />
      <h1 className="mt-4 text-2xl font-black text-primary">
        Local no encontrado en PideTirúa
      </h1>
      <p className="mt-2 max-w-md text-sm text-on-surface-variant">
        El enlace o código QR que escaneaste no corresponde a un local activo en
        Tirúa o Quidico.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow hover:bg-primary-container"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver al Directorio Comunal</span>
      </Link>
    </div>
  );
}
