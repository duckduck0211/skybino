import { Users, CalendarDays, Pill, FileText, Activity, Clock } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const upcomingAppointments = [
  { time: "09:00", patient: "Lisa Bubulash", type: "Allgemein", status: "Bestätigt" },
  { time: "10:30", patient: "Klaus Müller", type: "Nachsorge", status: "Bestätigt" },
  { time: "11:00", patient: "Maria Weber", type: "Erstuntersuchung", status: "Ausstehend" },
  { time: "14:00", patient: "Thomas Bauer", type: "Blutabnahme", status: "Bestätigt" },
];

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Begrüßung */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Guten Morgen, Dr. Mustermann</h2>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Gesamtpatienten"
          value="1.248"
          description="Registrierte Patienten"
          icon={Users}
          trend={{ value: "+12%", positive: true }}
        />
        <StatsCard
          title="Heutige Termine"
          value="8"
          description="4 noch ausstehend"
          icon={CalendarDays}
          trend={{ value: "+2", positive: true }}
        />
        <StatsCard
          title="Aktive Rezepte"
          value="342"
          description="Laufende Verschreibungen"
          icon={Pill}
          trend={{ value: "-5%", positive: false }}
        />
        <StatsCard
          title="Offene Berichte"
          value="7"
          description="Warten auf Freigabe"
          icon={FileText}
          trend={{ value: "+3", positive: false }}
        />
      </div>

      {/* Unterer Bereich */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Heutige Termine */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Heutige Termine</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.map((appt, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 shrink-0">
                  <span className="text-sm font-mono font-medium text-muted-foreground">
                    {appt.time}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{appt.patient}</p>
                  <p className="text-xs text-muted-foreground">{appt.type}</p>
                </div>
                <Badge
                  variant={appt.status === "Bestätigt" ? "default" : "secondary"}
                  className="text-xs shrink-0"
                >
                  {appt.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Letzte Aktivitäten */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Praxis-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-3xl font-bold text-primary">98%</p>
              <p className="mt-1 text-sm text-muted-foreground">Patientenzufriedenheit</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-3xl font-bold text-primary">12 Min.</p>
              <p className="mt-1 text-sm text-muted-foreground">Ø Wartezeit heute</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-3xl font-bold text-primary">2</p>
              <p className="mt-1 text-sm text-muted-foreground">Dringende Fälle</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
