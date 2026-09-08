import { CreateCampaignForm } from "@/components/create-campaign-form";

export default function NewCampaignPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Start a campaign</h1>
        <p className="text-muted-foreground">
          Tokenize an invoice receivable or harvest share. Backers will check the
          creator on Aave, Compound, and Spark, then pledge HBAR from a Privy wallet.
        </p>
      </div>
      <section className="rounded-xl border bg-card p-5">
        <CreateCampaignForm />
      </section>
    </main>
  );
}
