import { FileText, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Berichte</h2>
          <p className="text-muted-foreground">Befunde, Arztbriefe und Dokumentation</p>
        </div>
        <Button className="gap-2">
          <FilePlus className="h-4 w-4" />
          Neuer Bericht
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Berichtswesen</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Erstellung und Verwaltung von Arztbriefen, Befundberichten und
            medizinischer Dokumentation. Dieses Modul ist noch in Entwicklung.
          </p>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Berichte anzeigen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
