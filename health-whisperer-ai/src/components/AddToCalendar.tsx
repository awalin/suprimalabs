import { Button } from "@/components/ui/button";
import { CalendarPlus, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadIcs, googleCalendarUrl, type IcsEvent } from "@/lib/ics";

type Props = {
  event: IcsEvent;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost" | "secondary";
  label?: string;
};

export default function AddToCalendar({ event, size = "sm", variant = "outline", label = "Add to calendar" }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant}>
          <CalendarPlus className="h-4 w-4 mr-1.5" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadIcs(event.title.replace(/\s+/g, "-").toLowerCase(), [event])}>
          <Download className="h-4 w-4 mr-2" /> Apple / Outlook (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
