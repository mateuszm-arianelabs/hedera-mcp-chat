import Header from "../components/Header";
import ChatHost from "../components/ChatHost";

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      <Header />
      <div className="flex-1">
        <ChatHost />
      </div>
    </main>
  );
}
