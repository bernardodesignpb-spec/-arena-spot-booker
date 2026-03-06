export const sports = ["Vôlei", "Beach Tennis", "Futevôlei"] as const;
export type Sport = typeof sports[number];

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  sport?: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  status: "pendente" | "confirmado" | "cancelado";
  createdAt: string;
}

const STORAGE_KEY = "ala-beach-bookings";

export const getBookings = (): Booking[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const addBooking = (booking: Omit<Booking, "id" | "createdAt" | "status">): Booking => {
  const bookings = getBookings();
  const newBooking: Booking = {
    ...booking,
    id: crypto.randomUUID(),
    status: "pendente",
    createdAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  return newBooking;
};

export const updateBookingStatus = (id: string, status: Booking["status"]) => {
  const bookings = getBookings();
  const updated = bookings.map((b) => (b.id === id ? { ...b, status } : b));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const deleteBooking = (id: string) => {
  const bookings = getBookings();
  const filtered = bookings.filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const isTimeSlotBooked = (courtId: string, date: string, time: string): boolean => {
  const bookings = getBookings();
  return bookings.some(
    (b) => b.courtId === courtId && b.date === date && b.time === time && b.status !== "cancelado"
  );
};

export const courtNames: Record<string, string> = {
  "quadra-01": "Quadra 01",
  "quadra-02": "Quadra 02",
  "quadra-03": "Quadra 03",
  "quadra-04": "Quadra 04",
  "quadra-05": "Quadra 05",
  society: "Campo Society",
};

export const courtPrices: Record<string, string> = {
  "quadra-01": "R$ 45",
  "quadra-02": "R$ 45",
  "quadra-03": "R$ 45",
  "quadra-04": "R$ 45",
  "quadra-05": "R$ 45",
  society: "R$ 100",
};

export interface DurationOption {
  label: string;
  duration: string;
  price: string;
  slots: number; // how many 1h slots it occupies
}

export const societyDurations: DurationOption[] = [
  { label: "1 hora", duration: "1h", price: "R$ 100", slots: 1 },
  { label: "1 hora e 30 min", duration: "1:30h", price: "R$ 140", slots: 2 },
  { label: "2 horas", duration: "2h", price: "R$ 180", slots: 2 },
];

export const timeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
];
