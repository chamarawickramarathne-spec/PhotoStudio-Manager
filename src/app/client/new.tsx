import { Screen, AppHeader } from "@/components/ui/Screen";
import { ClientForm } from "@/forms/ClientForm";
import { router } from "expo-router";

export default function NewClientScreen() {
  return (
    <>
      <AppHeader title="Add Client" subtitle="New client details" showBack />
      <Screen>
        <ClientForm
          onSuccess={() => {
            router.back();
          }}
        />
      </Screen>
    </>
  );
}
