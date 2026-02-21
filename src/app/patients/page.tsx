import { Users, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patienten</h2>
          <p className="text-muted-foreground">Verwaltung aller Patientendaten</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Neuer Patient
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Patientenverwaltung</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Hier werden alle Patientendaten, Krankenakten und Kontaktinformationen verwaltet.
            Dieses Modul ist noch in Entwicklung.
          </p>
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Patienten suchen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
