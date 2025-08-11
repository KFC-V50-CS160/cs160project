import React, { useEffect, useId, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { styles } from "./RecipeDetail.styles";
import "./RecipeDetail.css";
import type { Route } from "./+types/RecipeDetail";

// 使用统一的API服务
import { fetchRecipeDetail, fetchRecipeImage } from "../services/recipeApi";

// 类型定义（与recipeApi.ts保持一致）
type Ingredient = { name: string; quantity: number; unit: string; ready: boolean; substitution: string };
type Tool = { name: string; quantity: number };
type Step = { time: number; instruction: string };
type RecipeDetail = {
  title: string;
  ingredient_checklist: Ingredient[];
  kitchen_setup: Tool[];
  complete_instructions: Step[];
  instruction_summary: string;
  difficulty?: string;
  estimatedTime?: number;
  missingItemsCount?: number;
};

type ApiState =
  | { status: "idle" | "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: RecipeDetail | null };

function useRecipeDetail() {
  const { dishName } = useParams<{ dishName: string }>();
  const [searchParams] = useSearchParams();
  const userPreferences = searchParams.get("prefs") ?? "";
  const userDishes = searchParams.get("dishes") ?? "";
  
  const shouldFetch = dishName && dishName.trim().length > 0;
  const [state, setState] = useState<ApiState>({ status: "idle" });

  const fetchData = async () => {
    if (!shouldFetch) {
      setState({ status: "success", data: null });
      return;
    }

    setState({ status: "loading" });
    
    try {
      console.log(`[RecipeDetail] Fetching data for: ${dishName}`);
      const data = await fetchRecipeDetail(dishName, userPreferences, userDishes);
      console.log(`[RecipeDetail] Successfully fetched data for: ${dishName}`);
      setState({ status: "success", data });
    } catch (error: any) {
      console.error(`[RecipeDetail] Failed to fetch data for: ${dishName}`, error);
      setState({ status: "error", error: error.message || "Failed to fetch recipe data" });
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishName, userPreferences, userDishes, shouldFetch]);

  const refetch = async (bypassCache?: boolean) => {
    if (bypassCache && typeof window !== "undefined") {
      // 清除相关缓存
      const cachePattern = `magicfridge_recipe_details_${encodeURIComponent(dishName || "")}`;
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.includes(cachePattern)) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn("Failed to clear cache", e);
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
  imageUrl?: string;
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

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Recipe Detail - MagicFridge" },
    { name: "description", content: "Detailed recipe instructions and ingredients" },
  ];
}

export default function RecipeDetailPage() {
  const navigate = useNavigate();
  const { dishName, state, refetch } = useRecipeDetail();
  const [isFavorite, setIsFavorite] = useState(false);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);

  // 计算 estimatedTime
  const estimatedTime = useMemo(() => {
    if (state.status === "success" && Array.isArray(state.data?.complete_instructions)) {
      return state.data.complete_instructions.reduce((sum, step) => sum + (step.time || 0), 0);
    }
    return null;
  }, [state]);

  // 首帧hydration
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const title = useMemo(() => {
    if (state.status === "success" && state.data?.title) return state.data.title;
    return dishName || "Data unavailable";
  }, [state, dishName]);

  // 获取封面图
  useEffect(() => {
    if (!hydrated) return;
    const recipeName = 
      (state.status === "success" && state.data?.title) || dishName || "";
    if (!recipeName) return;

    const getHeroImage = async () => {
      try {
        console.log(`[RecipeDetail] Fetching hero image for: ${recipeName}`);
        const imageUrl = await fetchRecipeImage(recipeName);
        if (imageUrl) {
          setHeroUrl(imageUrl);
          console.log(`[RecipeDetail] Got hero image: ${imageUrl}`);
        }
      } catch (error) {
        console.error(`[RecipeDetail] Failed to fetch hero image:`, error);
        setHeroUrl(null);
      }
    };

    getHeroImage();
  }, [hydrated, state, dishName]);

  const handleStartCooking = () => {
    console.log(`start cooking: ${dishName}`);
    // TODO: 可以导航到cooking页面
  };

  // 客户端首帧与服务端一致
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
                imageUrl={heroUrl || undefined}
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
