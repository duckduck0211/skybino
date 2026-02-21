import { CalendarDays, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Termine</h2>
          <p className="text-muted-foreground">Terminplanung und Kalenderübersicht</p>
        </div>
        <Button className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          Neuer Termin
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <CalendarDays className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Terminkalender</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Hier können Termine geplant, bearbeitet und verwaltet werden.
            Ein vollständiger Kalender mit Tages-, Wochen- und Monatsansicht ist geplant.
          </p>
          <Button variant="outline" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Kalender öffnen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
