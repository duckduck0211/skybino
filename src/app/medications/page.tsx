import { Pill, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MedicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Medikamente</h2>
          <p className="text-muted-foreground">Rezepte und Verschreibungsverwaltung</p>
        </div>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Rezept ausstellen
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Pill className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Medikamentenverwaltung</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Verwaltung von Rezepten, aktiven Verschreibungen und Medikamentendatenbank.
            Dieses Modul ist noch in Entwicklung.
          </p>
          <Button variant="outline" className="gap-2">
            <Pill className="h-4 w-4" />
            Datenbank durchsuchen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
