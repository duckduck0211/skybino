import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const activities = [
  {
    id: 1,
    patient: "Lisa Bubulash",
    initials: "LB",
    action: "Neue Untersuchung",
    time: "Vor 10 Min.",
    status: "Abgeschlossen",
    statusVariant: "default" as const,
  },
  {
    id: 2,
    patient: "Klaus Müller",
    initials: "KM",
    action: "Termin gebucht",
    time: "Vor 25 Min.",
    status: "Ausstehend",
    statusVariant: "secondary" as const,
  },
  {
    id: 3,
    patient: "Maria Weber",
    initials: "MW",
    action: "Rezept ausgestellt",
    time: "Vor 1 Std.",
    status: "Abgeschlossen",
    statusVariant: "default" as const,
  },
  {
    id: 4,
    patient: "Thomas Bauer",
    initials: "TB",
    action: "Befund erstellt",
    time: "Vor 2 Std.",
    status: "In Bearbeitung",
    statusVariant: "outline" as const,
  },
  {
    id: 5,
    patient: "Lisa Fischer",
    initials: "LF",
    action: "Erstuntersuchung",
    time: "Vor 3 Std.",
    status: "Abgeschlossen",
    statusVariant: "default" as const,
  },
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Letzte Aktivitäten</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-4">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {activity.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.patient}</p>
              <p className="text-xs text-muted-foreground">{activity.action}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant={activity.statusVariant} className="text-xs">
                {activity.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
