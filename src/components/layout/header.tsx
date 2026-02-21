"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  "/patients": "Patienten",
  "/appointments": "Termine",
  "/medications": "Medikamente",
  "/reports": "Berichte",
  "/settings": "Einstellungen",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "MedApp";

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
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <AppSidebar />
        </SheetContent>
      </Sheet>

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

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
        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
          3
        </Badge>
      </div>

      {/* User Avatar */}
      <Avatar className="h-8 w-8 cursor-pointer">
        <AvatarImage src="" />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
          DR
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
