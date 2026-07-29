import { Helmet } from "react-helmet-async";
import JerryBot from "@/components/JerryBot/JerryBot";

export default function JerryDemo() {
  return (
    <div className="px-3 py-4">
      <Helmet>
        <title>Jerry AI – Smart Dairy Assistant</title>
        <meta
          name="description"
          content="Chat with Jerry, the Smart Dairy Hub AI assistant, for milk rates, vet help, schemes and dairy farming tips in your language."
        />
      </Helmet>
      <h1 className="sr-only">Jerry – Smart Dairy Assistant</h1>
      <JerryBot variant="page" />
    </div>
  );
}
