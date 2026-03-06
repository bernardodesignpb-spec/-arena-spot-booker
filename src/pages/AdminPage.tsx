import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getBookings, updateBookingStatus, deleteBooking, Booking, courtNames, timeSlots } from "@/lib/bookings";
import { verifyAdminPassword, createSession, isSessionValid, clearSession, isPasswordConfigured } from "@/lib/auth";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, ArrowLeft, LogOut, Lock, Trash2, Search, ChevronLeft, ChevronRight, CalendarIcon, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const statusConfig = {
  pendente: { label: "Pendente", icon: Clock, color: "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30" },
  confirmado: { label: "Confirmado", icon: CheckCircle, color: "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30" },
};

const courtIds = Object.keys(courtNames);

const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"todos" | Booking["status"]>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"quadras" | "lista">("quadras");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const carouselRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSessionValid()) {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      setBookings(getBookings());
    }
  }, [authenticated]);

  const refreshBookings = () => setBookings(getBookings());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const valid = await verifyAdminPassword(password);
      if (valid) {
        createSession();
        setAuthenticated(true);
        if (!isPasswordConfigured()) {
          toast.success("Senha admin configurada com sucesso!");
        }
      } else {
        setAuthError("Senha incorreta");
        setPassword("");
      }
    } catch {
      setAuthError("Erro ao verificar senha");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setAuthenticated(false);
    setPassword("");
    toast.success("Sessao encerrada");
  };

  const handleStatus = (id: string, status: Booking["status"]) => {
    updateBookingStatus(id, status);
    refreshBookings();
    toast.success(status === "confirmado" ? "Agendamento confirmado!" : "Agendamento cancelado.");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este agendamento?")) return;
    deleteBooking(id);
    refreshBookings();
    toast.success("Agendamento excluido.");
  };

  const filtered = bookings
    .filter((b) => filter === "todos" || b.status === filter)
    .filter((b) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        b.name.toLowerCase().includes(term) ||
        b.phone.includes(term) ||
        b.courtName.toLowerCase().includes(term) ||
        b.date.includes(term)
      );
    });

  const stats = {
    total: bookings.length,
    pendente: bookings.filter((b) => b.status === "pendente").length,
    confirmado: bookings.filter((b) => b.status === "confirmado").length,
    cancelado: bookings.filter((b) => b.status === "cancelado").length,
  };

  // Get bookings for a specific court and date
  const getCourtBookings = (courtId: string, date: string) => {
    return bookings.filter(
      (b) => b.courtId === courtId && b.date === date && b.status !== "cancelado"
    );
  };

  // Get booking for a specific slot
  const getSlotBooking = (courtId: string, date: string, time: string) => {
    return bookings.find(
      (b) => b.courtId === courtId && b.date === date && b.time.includes(time) && b.status !== "cancelado"
    );
  };

  const prevCourt = () => setCarouselIndex((i) => (i === 0 ? courtIds.length - 1 : i - 1));
  const nextCourt = () => setCarouselIndex((i) => (i === courtIds.length - 1 ? 0 : i + 1));

  // Date navigation
  const dateObj = new Date(selectedDate + "T12:00:00");
  const prevDate = () => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() - 1);
    setSelectedDate(format(d, "yyyy-MM-dd"));
  };
  const nextDate = () => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() + 1);
    setSelectedDate(format(d, "yyyy-MM-dd"));
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 px-4 flex items-center justify-center min-h-screen">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-display tracking-wide mb-2">ADMIN</h1>
              <p className="text-sm text-muted-foreground font-body mb-6">
                {isPasswordConfigured()
                  ? "Digite sua senha para acessar"
                  : "Primeiro acesso: defina sua senha de admin"}
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
                  placeholder="Senha"
                  className="h-12 font-body rounded-xl text-center"
                  autoFocus
                  minLength={4}
                />
                {authError && (
                  <p className="text-sm text-destructive font-body">{authError}</p>
                )}
                <Button
                  type="submit"
                  disabled={authLoading || !password.trim()}
                  className="w-full h-12 font-body font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl btn-animate hover:shadow-primary/20"
                >
                  {authLoading ? "Verificando..." : isPasswordConfigured() ? "Entrar" : "Definir Senha"}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentCourtId = courtIds[carouselIndex];
  const currentCourtName = courtNames[currentCourtId];
  const currentCourtBookings = getCourtBookings(currentCourtId, selectedDate);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <motion.button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground font-body hover:text-foreground transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ArrowLeft size={18} /> Voltar
          </motion.button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="font-body gap-2 rounded-xl"
          >
            <LogOut size={14} /> Sair
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-display tracking-wide mb-2">
            PAINEL <span className="text-primary">ADMIN</span>
          </h1>
          <p className="text-muted-foreground font-body mb-6">
            Gerencie os agendamentos da arena
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Pendentes", value: stats.pendente, color: "text-amber-500" },
              { label: "Confirmados", value: stats.confirmado, color: "text-emerald-500" },
              { label: "Cancelados", value: stats.cancelado, color: "text-red-500" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
                <p className={`text-2xl font-display ${stat.color}`}>{stat.value}</p>
                <p className="text-xs font-body text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab("quadras")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all",
                tab === "quadras"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <LayoutGrid size={16} /> Quadras
            </button>
            <button
              onClick={() => setTab("lista")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all",
                tab === "lista"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <List size={16} /> Lista
            </button>
          </div>

          {/* =================== TAB: QUADRAS (Carousel) =================== */}
          {tab === "quadras" && (
            <div className="space-y-6">
              {/* Date navigator */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={prevDate}
                  className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all btn-animate"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border min-w-[200px] justify-center">
                  <CalendarIcon size={16} className="text-primary" />
                  <span className="font-body text-sm font-medium text-foreground">
                    {format(dateObj, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
                <button
                  onClick={nextDate}
                  className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all btn-animate"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Court carousel */}
              <div className="relative" ref={carouselRef}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={prevCourt}
                    className="shrink-0 p-2 sm:p-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all btn-animate"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <motion.div
                    key={currentCourtId}
                    className="flex-1 glass-card rounded-2xl overflow-hidden"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Court header */}
                    <div className="bg-primary/10 px-4 sm:px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-xl sm:text-2xl text-foreground">
                          {currentCourtName}
                        </h3>
                        <p className="text-xs font-body text-muted-foreground">
                          {currentCourtBookings.length} horario(s) ocupado(s)
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {courtIds.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCarouselIndex(idx)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all",
                              idx === carouselIndex ? "bg-primary w-6" : "bg-border hover:bg-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Time slots grid */}
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {timeSlots.map((time) => {
                          const booking = getSlotBooking(currentCourtId, selectedDate, time);
                          const isBooked = !!booking;
                          const isPendente = booking?.status === "pendente";
                          const isConfirmado = booking?.status === "confirmado";

                          return (
                            <div
                              key={time}
                              className={cn(
                                "relative rounded-xl p-2 sm:p-3 text-center transition-all",
                                isConfirmado
                                  ? "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700"
                                  : isPendente
                                  ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700"
                                  : "bg-muted/50 border border-border/50"
                              )}
                            >
                              <p className={cn(
                                "font-body text-sm font-semibold",
                                isConfirmado ? "text-emerald-700 dark:text-emerald-400"
                                  : isPendente ? "text-amber-700 dark:text-amber-400"
                                  : "text-muted-foreground/50"
                              )}>
                                {time}
                              </p>
                              {isBooked ? (
                                <div className="mt-1">
                                  <p className="text-[10px] sm:text-xs font-body text-foreground truncate font-medium">
                                    {booking.name.split(" ")[0]}
                                  </p>
                                  {booking.sport && (
                                    <p className="text-[9px] sm:text-[10px] font-body text-muted-foreground truncate">
                                      {booking.sport}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-center gap-0.5 mt-1">
                                    {isPendente ? (
                                      <Clock size={10} className="text-amber-600 dark:text-amber-400" />
                                    ) : (
                                      <CheckCircle size={10} className="text-emerald-600 dark:text-emerald-400" />
                                    )}
                                    <span className={cn(
                                      "text-[9px] font-body",
                                      isPendente ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                                    )}>
                                      {isPendente ? "Pend." : "Conf."}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] sm:text-xs font-body text-muted-foreground/40 mt-1">
                                  Livre
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                  <button
                    onClick={nextCourt}
                    className="shrink-0 p-2 sm:p-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all btn-animate"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Pending bookings for current court */}
              {currentCourtBookings.filter((b) => b.status === "pendente").length > 0 && (
                <div>
                  <h4 className="font-display text-lg mb-3">Pendentes - {currentCourtName}</h4>
                  <div className="space-y-2">
                    {currentCourtBookings
                      .filter((b) => b.status === "pendente")
                      .map((booking) => (
                        <div key={booking.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-sm font-body text-muted-foreground space-y-0.5 min-w-0">
                            <p className="text-foreground font-medium">
                              {booking.name} - {booking.time}
                            </p>
                            {booking.sport && <p className="text-xs">Esporte: {booking.sport}</p>}
                            <p className="text-xs">{booking.phone}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              onClick={() => handleStatus(booking.id, "confirmado")}
                              className="bg-emerald-600 text-white hover:bg-emerald-700 font-body rounded-xl text-xs btn-animate hover:shadow-emerald-500/20"
                              size="sm"
                            >
                              <CheckCircle size={14} className="mr-1" /> Confirmar
                            </Button>
                            <Button
                              onClick={() => handleStatus(booking.id, "cancelado")}
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10 font-body rounded-xl text-xs btn-animate"
                            >
                              <XCircle size={14} className="mr-1" /> Cancelar
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================== TAB: LISTA =================== */}
          {tab === "lista" && (
            <div>
              {/* Search + Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, telefone, quadra..."
                    className="h-10 pl-9 font-body rounded-xl text-sm"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["todos", "pendente", "confirmado", "cancelado"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-body font-medium transition-all capitalize",
                        filter === f
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {f}
                      {f !== "todos" && (
                        <span className="ml-1.5 opacity-60">
                          {stats[f as keyof typeof stats]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground font-body">
                  <p className="text-lg">Nenhum agendamento encontrado</p>
                  <p className="text-sm mt-1">
                    {searchTerm ? "Tente buscar por outro termo" : "Os agendamentos aparecerao aqui"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((booking, i) => {
                      const cfg = statusConfig[booking.status];
                      const StatusIcon = cfg.icon;
                      return (
                        <motion.div
                          key={booking.id}
                          className="glass-card rounded-xl p-5"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-display text-lg">{booking.courtName}</h3>
                                <span className={cn(
                                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-body font-medium",
                                  cfg.color
                                )}>
                                  <StatusIcon size={12} />
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="text-sm font-body text-muted-foreground space-y-0.5">
                                {booking.sport && <p>Esporte: {booking.sport}</p>}
                                <p>{booking.date} as {booking.time}</p>
                                <p>{booking.name} - {booking.phone}</p>
                                <p className="text-xs text-muted-foreground/50">
                                  Criado em {format(new Date(booking.createdAt), "dd/MM/yyyy HH:mm")}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2 shrink-0 flex-wrap">
                              {booking.status === "pendente" && (
                                <>
                                  <Button
                                    onClick={() => handleStatus(booking.id, "confirmado")}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700 font-body rounded-xl text-xs sm:text-sm btn-animate hover:shadow-emerald-500/20"
                                    size="sm"
                                  >
                                    <CheckCircle size={14} className="mr-1" /> Confirmar
                                  </Button>
                                  <Button
                                    onClick={() => handleStatus(booking.id, "cancelado")}
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive border-destructive/30 hover:bg-destructive/10 font-body rounded-xl text-xs sm:text-sm btn-animate"
                                  >
                                    <XCircle size={14} className="mr-1" /> Cancelar
                                  </Button>
                                </>
                              )}
                              {booking.status === "cancelado" && (
                                <Button
                                  onClick={() => handleDelete(booking.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-destructive font-body rounded-xl text-xs sm:text-sm"
                                >
                                  <Trash2 size={14} className="mr-1" /> Excluir
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminPage;
