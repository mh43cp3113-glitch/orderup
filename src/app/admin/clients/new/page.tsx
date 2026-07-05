import { NewClientForm } from "./new-client-form";

export default function NewClientPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Onboard a new business</h1>
        <p className="text-sm text-muted-foreground">
          Create the business profile and its first admin login.
        </p>
      </div>
      <NewClientForm />
    </div>
  );
}
