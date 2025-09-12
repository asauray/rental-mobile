import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed":
                return "bg-green-500";
            case "pending_capture":
                return "bg-yellow-500";
            case "cancelled":
                return "bg-red-500";
        }
    }

    return (
        <Badge className={ cn(getStatusColor(status), "text-white", "text-xs", "font-semibold", "w-full")}><Text>{status}</Text></Badge>
    )
}