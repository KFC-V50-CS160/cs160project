import React, { useEffect, useId, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { styles } from "./RecipeDetail.styles";
import "./RecipeDetail.css";

// TODO: move API call behind a server-side proxy; add analytics & i18n.

type Ingredient = { name: string; quantity: number; unit: string; ready: boolean; substitution: string };
type Tool = { name: string; quantity: number };
type Step = { time: number; instruction: string };
type RecipeDetail = {
  title: string;
  ingredient_checklist: Ingredient[];
  kitchen_setup: Tool[];
  complete_instructions: Step[];
  instruction_summary: string; // 单个字符串
};

type ApiState =
  | { status: "idle" | "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: RecipeDetail | null };

// 简单响应校验，返回错误列表便于定位
function validateRecipeDetail(obj: any): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") {
    errors.push("Response is not an object");
    return { ok: false, errors };
  }
  const topKeys: (keyof RecipeDetail)[] = [
    "title",
    "ingredient_checklist",
    "kitchen_setup",
    "complete_instructions",
    "instruction_summary"
  ];
  for (const k of topKeys) {
    if (!(k in obj)) errors.push(`Missing field: ${String(k)}`);
  }
  if (typeof obj.title !== "string") errors.push("title must be string");
  if (!Array.isArray(obj.ingredient_checklist)) errors.push("ingredient_checklist must be array");
  if (!Array.isArray(obj.kitchen_setup)) errors.push("kitchen_setup must be array");
  if (!Array.isArray(obj.complete_instructions)) errors.push("complete_instructions must be array");
  // 修改为 string 校验
  if (typeof obj.instruction_summary !== "string") errors.push("instruction_summary must be string");

  // 细项抽样校验（最多检查前 3 项，避免日志过长）
  const ings = Array.isArray(obj.ingredient_checklist) ? obj.ingredient_checklist.slice(0, 3) : [];
  ings.forEach((it: any, idx: number) => {
    if (!it || typeof it !== "object") errors.push(`ingredient[${idx}] not object`);
    if (typeof it?.name !== "string") errors.push(`ingredient[${idx}].name not string`);
    if (typeof it?.unit !== "string") errors.push(`ingredient[${idx}].unit not string`);
    if (typeof it?.ready !== "boolean") errors.push(`ingredient[${idx}].ready not boolean`);
  });
  const tools = Array.isArray(obj.kitchen_setup) ? obj.kitchen_setup.slice(0, 3) : [];
  tools.forEach((it: any, idx: number) => {
    if (typeof it?.name !== "string") errors.push(`tool[${idx}].name not string`);
  });
  const steps = Array.isArray(obj.complete_instructions) ? obj.complete_instructions.slice(0, 3) : [];
  steps.forEach((it: any, idx: number) => {
    if (typeof it?.instruction !== "string") errors.push(`step[${idx}].instruction not string`);
  });

  return { ok: errors.length === 0, errors };
}

// 生成缓存 key（包含 dishName + prefs + dishes）
function makeCacheKey(dishName?: string, prefs?: string, dishes?: string) {
  const dn = encodeURIComponent(dishName ?? "");
  const p = encodeURIComponent(prefs ?? "");
  const d = encodeURIComponent(dishes ?? "");
  return `recipeDetail:${dn}|p:${p}|d:${d}`;
}

// 从缓存读取
function readCache(key: string): RecipeDetail | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const payload = parsed?.data ?? parsed;
    const shape = validateRecipeDetail(payload);
    if (shape.ok) {
      console.info("[RecipeDetail] cache hit", { key });
      return payload as RecipeDetail;
    }
    console.warn("[RecipeDetail] cache shape invalid, ignore", shape.errors);
    return null;
  } catch (e) {
    console.warn("[RecipeDetail] cache read error", e);
    return null;
  }
}

// 写入缓存
function writeCache(key: string, data: RecipeDetail) {
  if (typeof window === "undefined") return;
  try {
    const pack = { t: Date.now(), data };
    window.localStorage.setItem(key, JSON.stringify(pack));
    console.info("[RecipeDetail] cache saved", { key });
  } catch (e) {
    console.warn("[RecipeDetail] cache write error", e);
  }
}

// 写入/读取 RecipeDetail 的缓存已存在
// 下面新增：封面图缓存（按 recipeName 维度）
function makeHeroKey(recipeName: string) {
  return `recipeHero:${encodeURIComponent(recipeName)}`;
}
function readHero(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const url = typeof parsed?.url === "string" ? parsed.url : null;
    if (url) {
      console.info("[RecipeDetail] hero cache hit", { key });
      return url;
    }
    return null;
  } catch (e) {
    console.warn("[RecipeDetail] hero cache read error", e);
    return null;
  }
}
function writeHero(key: string, url: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ t: Date.now(), url }));
    console.info("[RecipeDetail] hero cache saved", { key });
  } catch (e) {
    console.warn("[RecipeDetail] hero cache write error", e);
  }
}

function useRecipeDetail() {
  // 期望访问路径示例：
  // /recipes/Mapo%20Tofu?prefs=vegetarian&dishes=rice%2Ctofu
  // 或（建议 JSON）：
  // /recipes/Mapo%20Tofu?prefs=%7B%22diet%22%3A%22vegan%22%7D&dishes=%5B%22rice%22%2C%22bok%20choy%22%5D
  const { dishName } = useParams<{ dishName: string }>();
  const [searchParams] = useSearchParams();
  const userPreferences = searchParams.get("prefs") ?? "N.A.";
  const userDishes = searchParams.get("dishes") ?? "N.A.";
  // 当 dishName 缺失且 prefs/dishes 都为 "N.A." 时，不发起请求，直接显示兜底。
  const shouldFetch =
    (dishName && dishName.trim().length > 0) ||
    userPreferences !== "N.A." ||
    userDishes !== "N.A.";

  const [state, setState] = useState<ApiState>({ status: "idle" });

  // 组合缓存 key
  const cacheKey = useMemo(
    () => makeCacheKey(dishName, userPreferences, userDishes),
    [dishName, userPreferences, userDishes]
  );

  const fetchData = async () => {
    setState({ status: "loading" });

    const start = performance.now?.() ?? Date.now();
    console.groupCollapsed("[RecipeDetail] fetch start");
    console.log("params", { dishName, userPreferences, userDishes });

    const controller = new AbortController();
    try {
      const res = await fetch("https://noggin.rea.gent/strong-crocodile-1199", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer rg_v1_9ywglo9vl0010xmeb2u0c4iqsuem814wzi1e_ngk"
        },
        body: JSON.stringify({
          dishName: dishName || "",
          userPreferences,
          userDishes
        }),
        signal: controller.signal
      });

      console.log("response status", res.status, res.statusText);

      let rawText = "";
      let json: unknown = null;

      // 优先尝试 JSON；失败则读取文本并抛详细错
      try {
        json = await res.clone().json();
      } catch (e: any) {
        try {
          rawText = await res.clone().text();
        } catch (_e) {
          // ignore
        }
        if (!res.ok) {
          const errMsg = `HTTP ${res.status} ${res.statusText}. Non-JSON response: ${rawText?.slice(0, 400)}`;
          console.error("[RecipeDetail] http error non-JSON", errMsg);
          setState({ status: "error", error: errMsg });
          return;
        }
        const errMsg = `JSON parse error: ${(e && e.message) || "unknown"}. Body preview: ${rawText?.slice(0, 400)}`;
        console.error("[RecipeDetail] json parse error", errMsg);
        setState({ status: "error", error: errMsg });
        return;
      }

      if (!res.ok) {
        const text = rawText || (typeof json === "string" ? json : JSON.stringify(json));
        const errMsg = `HTTP ${res.status} ${res.statusText}. Body preview: ${String(text).slice(0, 400)}`;
        console.error("[RecipeDetail] http error", errMsg);
        setState({ status: "error", error: errMsg });
        return;
      }

      const shape = validateRecipeDetail(json);
      if (!shape.ok) {
        const errMsg = `Invalid response shape: ${shape.errors.join("; ")}`;
        console.error("[RecipeDetail] shape validation failed", shape.errors, json);
        setState({ status: "error", error: errMsg });
        return;
      }

      const data = json as RecipeDetail;

      // 写入缓存
      writeCache(cacheKey, data);

      console.groupCollapsed("[RecipeDetail] fetch success");
      console.log("title", data?.title);
      console.log("counts", {
        ingredients: data?.ingredient_checklist?.length ?? 0,
        tools: data?.kitchen_setup?.length ?? 0,
        steps: data?.complete_instructions?.length ?? 0,
        summaryChars: typeof data?.instruction_summary === "string" ? data.instruction_summary.length : 0
      });
      console.groupEnd();

      setState({ status: "success", data });
    } catch (err: any) {
      const errMsg = `Network/Abort error: ${err?.name || "Error"} - ${err?.message || "unknown"}`;
      console.error("[RecipeDetail] fetch exception", err);
      setState({ status: "error", error: errMsg });
    } finally {
      const end = performance.now?.() ?? Date.now();
      console.log("[RecipeDetail] fetch done in", Math.round(end - start), "ms");
      console.groupEnd();
    }
    return () => controller.abort();
  };

  useEffect(() => {
    if (!shouldFetch) {
      // 无输入时，不请求后端，直接展示 "Data unavailable" 兜底。
      setState({ status: "success", data: null });
      return;
    }

    // 先尝试从缓存读取
    const cached = readCache(cacheKey);
    if (cached) {
      setState({ status: "success", data: cached });
      return;
    }

    // 未命中缓存则发起请求
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishName, userPreferences, userDishes, shouldFetch, cacheKey]);

  // 支持绕过缓存的 refetch（用于错误重试或强制刷新）
  const refetch = async (bypassCache?: boolean) => {
    if (bypassCache && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(cacheKey);
        console.info("[RecipeDetail] cache cleared before refetch", { cacheKey });
      } catch (e) {
        console.warn("[RecipeDetail] cache clear failed", e);
      }
    }
    await fetchData();
  };

  return {
    dishName,
    userPreferences,
    userDishes,
    state,
    refetch
  };
}

function HeroCard(props: {
  title?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onStartCooking: () => void;
  estimatedTime?: number;
  imageUrl?: string; // 新增：用于展示生成的封面图
}) {
  const { title, isFavorite, onToggleFavorite, onStartCooking, estimatedTime, imageUrl } = props;
  const favBtnClass = isFavorite
    ? `${styles.heartBtn} bg-rose-600 text-white border-rose-600`
    : `${styles.heartBtn} text-rose-600 border-rose-300`;

  return (
    <div className={styles.hero}>
      <img
        src={imageUrl || "/kfc.jpg"}
        alt="Recipe Hero"
        className="w-full object-cover rounded-md"
        data-testid="hero-image"
      />
      <div>
        <div className="flex items-start gap-3">
          <h1 className={styles.title} data-testid="recipe-title">
            {title || "Data unavailable"}
          </h1>
          <button
            type="button"
            aria-label={isFavorite ? "Unfavorite" : "Favorite"}
            aria-pressed={isFavorite}
            onClick={onToggleFavorite}
            className={favBtnClass}
            data-testid="favorite-btn"
          >
            <span aria-hidden="true">❤</span>
          </button>
          {typeof estimatedTime === "number" && (
            <span
              className="text-lg font-bold text-gray-700 ml-3"
              data-testid="estimated-time"
            >
              {`Estimated time: ${estimatedTime} min`}
            </span>
          )}
        </div>
        <div className="mt-4">
          <button
            type="button"
            className={styles.ctaBtn}
            onClick={onStartCooking}
            data-testid="start-cooking"
          >
            Start Cooking
          </button>
        </div>
      </div>
    </div>
  );
}

function Section(props: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const { title, defaultOpen, children } = props;
  const [open, setOpen] = useState<boolean>(!!defaultOpen);
  const contentId = useId();

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.sectionHeader}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      <div id={contentId} className={styles.sectionBody} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

function IngredientList({ items }: { items: Ingredient[] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p>Data unavailable</p>;
  }
  return (
    <ul className="divide-y divide-gray-200" data-testid="ingredient-list">
      {items.map((ing, idx) => {
        const missing = !ing.ready;
        return (
          <li key={`${ing.name}-${idx}`} className={`${styles.ingredientRow} ${missing ? styles.ingredientMissing : ""}`}>
            <div className={`dot-leader ${missing ? "text-red-700" : ""}`}>
              <span>{ing.name || "Data unavailable"}</span>
              <span className="dots" aria-hidden="true" />
              <span className={styles.qty}>
                {Number.isFinite(ing.quantity) ? ing.quantity : "?"} {ing.unit || ""}
              </span>
            </div>
            {!ing.ready && ing.substitution ? (
              <div className={styles.substitutionText}>Substitute: {ing.substitution}</div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ToolList({ items }: { items: Tool[] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p>Data unavailable</p>;
  }
  return (
    <ul className="list-disc pl-5 space-y-1" data-testid="tool-list">
      {items.map((t, idx) => (
        <li key={`${t.name}-${idx}`}>
          <span>{t.name || "Data unavailable"}</span>
          <span className="ml-2 text-gray-600">x{Number.isFinite(t.quantity) ? t.quantity : "?"}</span>
        </li>
      ))}
    </ul>
  );
}

function InstructionSummary({ text }: { text: string }) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return <p data-testid="instruction-summary">Data unavailable</p>;
  }
  return (
    <div className="space-y-2" data-testid="instruction-summary">
      <p className="text-gray-800">{text}</p>
    </div>
  );
}

function InstructionSteps({ steps }: { steps: Step[] }) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return <p data-testid="instruction-steps">Data unavailable</p>;
  }
  return (
    <ol className="list-decimal pl-5 space-y-2" data-testid="instruction-steps">
      {steps.map((s, i) => (
        <li key={i} className={styles.step}>
          <div className="flex-1">
            <p>{s.instruction || "Data unavailable"}</p>
          </div>
          <span className={styles.timeBadge} aria-label={`approximately ${s.time ?? "?"} minutes`}>
            ≈ {Number.isFinite(s.time) ? s.time : "?"} min
          </span>
        </li>
      ))}
    </ol>
  );
}

function SkeletonRecipeDetail() {
  return (
    <div className={styles.skeleton} role="status" aria-live="polite" aria-busy="true">
      <div className="h-6 w-32 bg-gray-200 rounded" />
      <div className="h-48 w-full bg-gray-200 rounded" />
      <div className="h-4 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-40 bg-gray-200 rounded" />
      <div className="h-64 w-full bg-gray-200 rounded" />
    </div>
  );
}

function ErrorState({ onRetry, message }: { onRetry: () => void; message?: string }) {
  return (
    <div className={styles.error} role="alert">
      <p>Request failed. Please try again.</p>
      {message ? (
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs bg-white/60 p-2 rounded border border-red-200">
          {message}
        </pre>
      ) : null}
      <button
        className="mt-2 px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-black"
        onClick={onRetry}
        data-testid="error-retry"
      >
        Retry
      </button>
    </div>
  );
}

export default function RecipeDetailPage() {
  const navigate = useNavigate();
  const { dishName, state, refetch } = useRecipeDetail();
  const [isFavorite, setIsFavorite] = useState(false);
  // 展示用的封面图 URL（生成成功则替换）
  const [heroUrl, setHeroUrl] = useState<string | null>(null);

  // 计算 estimatedTime
  const estimatedTime = useMemo(() => {
    if (state.status === "success" && Array.isArray(state.data?.complete_instructions)) {
      return state.data.complete_instructions.reduce((sum, step) => sum + (step.time || 0), 0);
    }
    return null;
  }, [state]);

  // 首帧“同构骨架”
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const title = useMemo(() => {
    if (state.status === "success" && state.data?.title) return state.data.title;
    return dishName || "Data unavailable";
  }, [state, dishName]);

  // 根据 recipeName 生成封面图（带缓存）
  useEffect(() => {
    if (!hydrated) return;
    const recipeName =
      (state.status === "success" && state.data?.title) || dishName || "";
    if (!recipeName) return;

    const heroKey = makeHeroKey(recipeName);

    // 先尝试缓存
    const cached = readHero(heroKey);
    if (cached) {
      setHeroUrl(cached);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    // TODO: 将图片生成 API 放到服务端代理
    (async () => {
      try {
        console.groupCollapsed("[RecipeDetail] hero image fetch");
        console.log("recipeName", recipeName);
        const res = await fetch("https://noggin.rea.gent/magic-tiglon-7454", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer rg_v1_ae72y97juphr37kmg4spwck0un6qdcdybw6r_ngk"
          },
          body: JSON.stringify({ recipeName }),
          signal: controller.signal
        });

        const text = await res.text();
        // 优先解析 JSON 里的 url 字段；否则尝试用 response.url 或将文本作为 URL
        let url = "";
        try {
          const maybe = JSON.parse(text);
          if (maybe && typeof maybe.url === "string") url = maybe.url;
        } catch {
          // ignore non-JSON
        }
        if (!url) {
          if (typeof res.url === "string" && res.url.startsWith("http")) {
            url = res.url;
          } else if (typeof text === "string" && /^https?:\/\//i.test(text.trim())) {
            url = text.trim();
          }
        }

        if (!url) {
          console.warn("[RecipeDetail] hero image: url not found in response");
          return;
        }
        if (!cancelled) {
          setHeroUrl(url);
          writeHero(heroKey, url);
          console.log("[RecipeDetail] hero image url", url);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[RecipeDetail] hero image error", e);
          setHeroUrl(null);
        }
      } finally {
        console.groupEnd();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [hydrated, state, dishName]);

  const handleStartCooking = () => {
    if (state.status === "success" && state.data) {
      // Navigate to cooking page with recipe data
      const recipeData = {
        title: state.data.title,
        instructions: state.data.complete_instructions.map(step => ({
          instruction: step.instruction,
          time: step.time
        }))
      };

      navigate('/cooking', {
        state: recipeData
      });
    }
  };

  // 客户端首帧强制与服务端一致：仅渲染骨架屏
  if (!hydrated) {
    return (
      <div className={styles.pageContainer} suppressHydrationWarning id="recipe-detail-root">
        <main className={styles.mainContainer}>
          <SkeletonRecipeDetail />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer} suppressHydrationWarning id="recipe-detail-root">
      <main className={styles.mainContainer}>
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
            data-testid="back-btn"
          >
            ← Back
          </button>
        </div>

        {state.status === "loading" || state.status === "idle" ? (
          <SkeletonRecipeDetail />
        ) : state.status === "error" ? (
          <ErrorState onRetry={() => refetch(true)} message={state.error} />
        ) : (
          <div className={styles.grid}>
            <div className={styles.leftPanel}>
              <HeroCard
                title={state.status === "success" ? state.data?.title : undefined}
                isFavorite={isFavorite}
                onToggleFavorite={() => setIsFavorite((v) => !v)}
                onStartCooking={handleStartCooking}
                estimatedTime={estimatedTime || undefined}
                imageUrl={heroUrl || undefined} // 传入生成的图片
              />
            </div>

            <div className={styles.rightPanel}>
              <Section title="Ingredient Checklist" defaultOpen>
                <IngredientList items={state.status === "success" && state.data?.ingredient_checklist ? state.data.ingredient_checklist : []} />
              </Section>

              <Section title="Kitchen Setup" defaultOpen>
                <ToolList items={state.status === "success" && state.data?.kitchen_setup ? state.data.kitchen_setup : []} />
              </Section>

              <Section title="Instruction Summary" defaultOpen>
                <InstructionSummary text={state.status === "success" && state.data?.instruction_summary ? state.data.instruction_summary : ""} />
              </Section>

              <Section title="Complete Instructions">
                <InstructionSteps steps={state.status === "success" && state.data?.complete_instructions ? state.data.complete_instructions : []} />
              </Section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

