import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadExcelButton() {
  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={
        <a href="/api/dashboard/export" download>
          <Download className="h-4 w-4" /> Download Excel
        </a>
      }
    />
  );
}
