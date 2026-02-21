"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/decks": "Meine Decks",
  "/create": "Deck erstellen",
  "/explore": "Entdecken",
  "/progress": "Fortschritt",
  "/settings": "Einstellungen",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Synapze";

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menü öffnen</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <AppSidebar />
        </SheetContent>
      </Sheet>

      {/* Mobile Logo */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <Zap className="h-3.5 w-3.5 text-primary-foreground" fill="currentColor" />
        </div>
        <span className="font-bold">Synapze</span>
      </div>

      {/* Page Title */}
      <div className="hidden flex-1 md:block">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex-1 md:hidden" />

      {/* Search */}
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Search className="h-5 w-5" />
        <span className="sr-only">Suchen</span>
      </Button>

      {/* Notifications */}
      <div className="relative">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Benachrichtigungen</span>
        </Button>
        <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
          2
        </Badge>
      </div>

      {/* User Avatar */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary cursor-pointer">
        MB
      </div>
    </header>
  );
}
