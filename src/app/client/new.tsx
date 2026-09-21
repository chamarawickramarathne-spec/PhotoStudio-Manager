import { Screen, AppHeader } from "@/components/ui/Screen";
import { ClientForm } from "@/forms/ClientForm";
import { router } from "@/navigation/router";

export default function NewClientScreen() {
  return (
    <>
      <AppHeader title="Add Client" subtitle="New client details" showBack />
      <Screen>
        <ClientForm
          onSuccess={() => {
            router.back();
          }}
          onCancel={() => {
            router.back();
          }}
        />
      </Screen>
    </>
  );
}
