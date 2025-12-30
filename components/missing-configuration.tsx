import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MissingConfigurationProps = {
  title: string;
  description?: string;
  items?: string[];
};

export function MissingConfiguration({ title, description, items }: MissingConfigurationProps) {
  return (
    <Card className="border-amber-200/70 bg-amber-50/80 text-amber-900">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription className="text-amber-800/80">{description}</CardDescription> : null}
        </div>
      </CardHeader>
      {items?.length ? (
        <CardContent className="text-sm leading-relaxed text-amber-900/90">
          <p className="font-medium">Set the following environment variables and redeploy:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {items.map((item) => (
              <li key={item}>
                <code>{item}</code>
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}
