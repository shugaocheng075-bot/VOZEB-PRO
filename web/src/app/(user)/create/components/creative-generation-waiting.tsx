"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import type { CreativeGenerationMode, CreativeMessage } from "@/lib/creative-runtime-contract";
import type { CreativeAgentRun } from "@/services/api/creative";

import { creativeAssetLayout } from "./creative-asset-layout";
import { creativeRunMode } from "./creative-run-presentation";

const LONG_WAIT_MESSAGES = ["主人，久等了，辛苦你再陪我一会儿，我一直在这里守着这次创作。", "主人，别担心，创作还在继续，不用重复发送，先放松一下，这里交给我守着吧。", "主人，作品正在慢慢雕琢，可能比平时久一点，但我没有离开。"] as const;

export function CreativeGenerationWaiting({
    run,
    message,
    mode,
}: {
    run?: CreativeAgentRun;
    message: Pick<CreativeMessage, "content" | "createdAt">;
    mode?: CreativeGenerationMode;
}) {
    const startedAt = run?.createdAt || message.createdAt;
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const update = () => setNow(Date.now());
        update();
        const timer = window.setInterval(update, 1000);
        return () => window.clearInterval(timer);
    }, [startedAt]);

    const resolvedMode = creativeRunMode(run) || mode;
    const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
    const copy = creativeGenerationWaitingCopy({ mode: resolvedMode, runStatus: run?.status, progressText: message.content, elapsedSeconds });
    const ratio = run?.tasks.find((task) => task.type === resolvedMode)?.ratio || (resolvedMode && resolvedMode !== "audio" ? run?.generationPreferences?.[resolvedMode]?.size : undefined);
    const layout = resolvedMode === "image" || resolvedMode === "video" ? creativeAssetLayout({}, { variant: resolvedMode === "video" ? "video-result" : "image-result", ratio }) : null;

    const status = (
        <div className="flex items-start gap-2.5">
            <Sparkles className="mt-1 size-4 shrink-0 animate-pulse text-primary/75" aria-hidden />
            <div className="min-w-0">
                <p className="text-sm leading-6 text-[#596474] dark:text-[#b0b8c2]" aria-live="polite">
                    {copy}
                </p>
                <p data-testid="creative-generation-elapsed" className="mt-0.5 text-[11px] tabular-nums leading-4 text-[#98a2b3] dark:text-[#7f8996]">
                    已等待 {formatCreativeWaitingTime(elapsedSeconds)}
                </p>
            </div>
        </div>
    );

    if (!layout) {
        return (
            <div data-testid="creative-generation-waiting" className="mb-3 max-w-[520px] py-1 text-[#667085] dark:text-[#a0a9b4]">
                {status}
            </div>
        );
    }

    return (
        <div data-testid="creative-generation-waiting" className="mb-3 w-fit max-w-full text-[#667085] dark:text-[#a0a9b4]">
            <figure
                data-testid="creative-generation-pending"
                data-rendered-width={layout.width}
                data-rendered-height={layout.height}
                style={layout.container}
                className="relative mb-3 max-w-full overflow-hidden rounded-xl border border-[#e4e7ec] bg-[#d7dde6] shadow-[0_4px_18px_rgba(15,23,42,0.035)] dark:border-[#303640] dark:bg-[#1b2028] dark:shadow-black/15"
            >
                <div className="creative-generation-pending-fog pointer-events-none absolute inset-0" aria-hidden />
            </figure>
            <style>{`
                .creative-generation-pending-fog {
                    background:
                        radial-gradient(42% 48% at 28% 34%, rgba(255, 255, 255, 0.22), transparent 72%),
                        radial-gradient(50% 42% at 74% 62%, rgba(148, 163, 184, 0.38), transparent 70%),
                        radial-gradient(38% 36% at 58% 22%, rgba(99, 102, 241, 0.16), transparent 68%);
                    animation: creative-generation-pending-fog 7s ease-in-out infinite;
                }
                @keyframes creative-generation-pending-fog {
                    0%, 100% { opacity: 0.72; transform: scale(1.04) translate3d(-2%, 1%, 0); }
                    50% { opacity: 1; transform: scale(1.12) translate3d(2%, -2%, 0); }
                }
            `}</style>
            {status}
        </div>
    );
}

export function creativeGenerationWaitingCopy({ mode, runStatus, progressText, elapsedSeconds }: { mode?: "text" | "image" | "video" | "audio"; runStatus?: CreativeAgentRun["status"]; progressText: string; elapsedSeconds: number }) {
    const progress = progressText.trim();
    if (runStatus === "paused" || /任务已暂停/.test(progress)) return "主人，任务已经替你暂停，进度好好保存着，想继续时叫我就好。";
    if (/连接暂时中断|无法确认实时状态/.test(progress)) return "主人，连接刚刚有些不稳，不过任务仍在后台继续，我正在替你确认。";
    if (/连接已恢复|恢复连接/.test(progress)) return "主人，连接恢复啦，我会继续守着这次创作。";
    if (/检查完成|正在整理|创作结果/.test(progress)) return "主人，作品已经生成，我正在整理最后的细节，很快就能交到你手上。";

    const activeTask = /正在处理|上游处理中|创作任务|重新生成|正在优化/.test(progress);
    if (!activeTask && (runStatus === "planning" || /理解需求|匹配创作技能|方案已确定|创建任务/.test(progress))) return planningCopy(mode);

    const elapsedMinutes = Math.floor(Math.max(0, elapsedSeconds) / 60);
    if (elapsedMinutes === 0) {
        if (mode === "image") return "主人，画面正在一点点显现，再给我一点点时间呀。";
        if (mode === "video") return "主人，镜头正在一帧帧铺开，我会在这里陪你等着。";
        if (mode === "audio") return "主人，声音正在一点点成形，我会替你仔细听好。";
        return "主人，灵感已经接住啦，我正在把它变成作品。";
    }
    if (elapsedMinutes === 1) return longWaitCopy(mode, false);
    return longWaitCopy(mode, true, LONG_WAIT_MESSAGES[(elapsedMinutes - 2) % LONG_WAIT_MESSAGES.length]);
}

function planningCopy(mode?: "text" | "image" | "video" | "audio") {
    if (mode === "image") return "主人，我接住你的灵感啦，正在把画面的氛围和细节安排好。";
    if (mode === "video") return "主人，我已经抓住这个镜头啦，正在把节奏和画面串起来。";
    if (mode === "audio") return "主人，我先替你把声音的语气和节奏调到合适。";
    return "主人，我先帮你把想法理顺，很快就给你一版好内容。";
}

function longWaitCopy(mode: "text" | "image" | "video" | "audio" | undefined, veryLong: boolean, fallback: string = "") {
    if (veryLong) {
        if (mode === "image") return "主人，画面还在细细打磨，不用重复发送，我会替你稳稳守着。";
        if (mode === "video") return "主人，久等了，镜头还在一帧帧渲染，不用重复发送，我会替你稳稳守着。";
        if (mode === "audio") return "主人，声音还在细细校准，不用重复发送，我会替你稳稳守着。";
        return fallback;
    }
    if (mode === "image") return "主人，画面还在认真打磨，马上就把好看的细节交给你。";
    if (mode === "video") return "主人，镜头还在慢慢铺开，再陪我一会儿，很快就好。";
    if (mode === "audio") return "主人，声音还在细细调校，再陪我一会儿，很快就好。";
    return "主人，文字还在认真打磨，再陪我一会儿，很快就好。";
}

export function formatCreativeWaitingTime(elapsedSeconds: number) {
    const totalSeconds = Math.max(0, Math.floor(elapsedSeconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours) return `${hours}小时${minutes ? `${minutes}分` : ""}${seconds ? `${seconds}秒` : ""}`;
    if (minutes) return `${minutes}分${seconds ? `${seconds}秒` : ""}`;
    return `${seconds}秒`;
}
