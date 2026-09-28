import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-4 text-2xl font-black text-slate-900">
        Local no encontrado en PideTirúa
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        El enlace o código QR que escaneaste no corresponde a un local activo en
        Tirúa o Quidico.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow hover:bg-sky-700"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver al Directorio Comunal</span>
      </Link>
    </div>
  );
}
