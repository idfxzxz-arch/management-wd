import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
          <div className="max-w-lg rounded-lg border border-amber-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            <h1 className="text-lg font-bold text-slate-900">Aplikasi gagal memuat halaman.</h1>
            <p className="mt-2">Silakan logout lalu login ulang. Jika masih muncul, kirim pesan error ini ke admin.</p>
            <pre className="mt-4 overflow-auto rounded bg-slate-950 p-3 text-xs text-white">{this.state.error.message}</pre>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
