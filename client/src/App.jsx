import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  // State chính của ứng dụng.
  const [cards, setCards] = useState([]);
  const [knownCards, setKnownCards] = useState([]);
  const [form, setForm] = useState({ front: "", back: "" });
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState({});
  const [message, setMessage] = useState("");

  const getStoredKnownIds = () => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("known-card-ids") || "[]");
    } catch {
      return [];
    }
  };

  const persistKnownIds = (ids) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("known-card-ids", JSON.stringify(ids));
  };

  // Đọc toàn bộ flashcard từ Supabase.
  const fetchCards = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Không thể tải dữ liệu từ Supabase. ${error.message || ""}`);
      console.error(error);
    } else {
      const allCards = data || [];
      const knownIds = new Set(getStoredKnownIds());
      const activeCards = allCards.filter(
        (card) => !knownIds.has(card.id) && !card.is_known,
      );
      const learnedCards = allCards.filter(
        (card) => knownIds.has(card.id) || card.is_known,
      );

      setCards(activeCards);
      setKnownCards(learnedCards);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // Thêm từ mới vào bảng flashcards.
  const addCard = async (e) => {
    e.preventDefault();
    if (!form.front.trim() || !form.back.trim()) {
      setMessage("Vui lòng nhập cả mặt trước và mặt sau.");
      return;
    }

    const { error } = await supabase.from("flashcards").insert([
      {
        front: form.front.trim(),
        back: form.back.trim(),
      },
    ]);

    if (error) {
      setMessage(`Không thể thêm từ mới. ${error.message || ""}`);
      console.error(error);
    } else {
      setForm({ front: "", back: "" });
      setMessage("Đã thêm từ mới thành công!");
      fetchCards();
    }
  };

  // Chuyển thẻ sang mục "Đã thuộc" thay vì xoá khỏi database.
  const markKnown = async (id) => {
    const cardToMove = cards.find((card) => card.id === id);
    if (!cardToMove) return;

    const storedKnownIds = [...new Set([...getStoredKnownIds(), id])];
    persistKnownIds(storedKnownIds);

    const { error } = await supabase
      .from("flashcards")
      .update({ is_known: true })
      .eq("id", id);

    if (error) {
      const isMissingColumnError =
        error.message?.includes("column") &&
        error.message?.includes("does not exist");

      if (isMissingColumnError) {
        setMessage(
          "Đã chuyển thẻ vào mục Đã thuộc và lưu tạm trên trình duyệt vì bảng chưa có cột trạng thái.",
        );
      } else {
        setMessage(
          `Không thể chuyển thẻ vào mục Đã thuộc. ${error.message || ""}`,
        );
        console.error(error);
        return;
      }
    } else {
      setMessage("Đã chuyển thẻ vào mục Đã thuộc.");
    }

    setCards((prev) => prev.filter((card) => card.id !== id));
    setKnownCards((prev) => {
      const exists = prev.some((card) => card.id === id);
      return exists ? prev : [cardToMove, ...prev];
    });
    setFlipped((prev) => ({ ...prev, [id]: false }));
  };

  const totalCards = useMemo(() => cards.length, [cards]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl shadow-black/20">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            Aimie Flashcards
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Học từ vựng mỗi ngày, dễ dàng trên điện thoại
          </h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Lưu và ôn tập từ mới ngay trên cloud, đồng bộ trên mọi thiết bị.
          </p>
        </header>

        {message ? (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            {message}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-black/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Flashcard học hôm nay</h2>
                <p className="text-sm text-slate-400">
                  {totalCards} từ còn lại
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                Đang tải từ vựng...
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                Chưa có từ nào. Thêm từ mới để bắt đầu nhé.
              </div>
            ) : (
              <div className="space-y-4">
                {cards.map((card) => {
                  const isFlipped = flipped[card.id];
                  return (
                    <div
                      key={card.id}
                      className="rounded-3xl border border-slate-700 bg-slate-800/80 p-3"
                    >
                      <div
                        className="group h-48 cursor-pointer rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 text-white shadow-lg transition-transform duration-300 [transform-style:preserve-3d]"
                        onClick={() =>
                          setFlipped((prev) => ({
                            ...prev,
                            [card.id]: !prev[card.id],
                          }))
                        }
                      >
                        <div className="flex h-full flex-col justify-between">
                          <div className="text-xs uppercase tracking-[0.35em] text-cyan-100">
                            Flashcard
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-cyan-100">Tap để lật</p>
                            <h3 className="mt-2 text-2xl font-bold">
                              {isFlipped ? card.back : card.front}
                            </h3>
                          </div>
                          <div className="text-right text-xs text-cyan-100">
                            {isFlipped ? "Mặt sau" : "Mặt trước"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => markKnown(card.id)}
                          className="flex-1 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
                        >
                          Đã thuộc
                        </button>
                        <button
                          onClick={() =>
                            setFlipped((prev) => ({
                              ...prev,
                              [card.id]: !prev[card.id],
                            }))
                          }
                          className="flex-1 rounded-2xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                        >
                          Lật thẻ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-300">
                    Đã thuộc
                  </h2>
                  <p className="text-sm text-slate-400">
                    {knownCards.length} từ đã hoàn thành
                  </p>
                </div>
              </div>

              {knownCards.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Chưa có thẻ nào được chuyển vào mục này.
                </p>
              ) : (
                <div className="space-y-2">
                  {knownCards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-2xl border border-emerald-500/20 bg-slate-950/60 px-3 py-2"
                    >
                      <p className="font-medium text-slate-100">{card.front}</p>
                      <p className="mt-1 text-sm text-slate-400">{card.back}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-black/10">
            <h2 className="text-lg font-semibold">Thêm từ mới</h2>
            <p className="mt-1 text-sm text-slate-400">
              Lưu thẳng lên Supabase để học trên mọi thiết bị.
            </p>

            <form onSubmit={addCard} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Mặt trước</span>
                <input
                  value={form.front}
                  onChange={(e) => setForm({ ...form, front: e.target.value })}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none ring-0"
                  placeholder="Ví dụ: Apple"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Mặt sau</span>
                <textarea
                  value={form.back}
                  onChange={(e) => setForm({ ...form, back: e.target.value })}
                  className="min-h-24 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none ring-0"
                  placeholder="Ví dụ: Quả táo"
                />
              </label>

              <button className="w-full rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                Thêm từ mới
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
