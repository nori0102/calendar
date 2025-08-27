"use client";

import * as React from "react";
import Link from "next/link";
import { RiCheckLine } from "@remixicon/react";
import { useCalendarContext } from "@/contexts/calendar-context";

import { NavUser } from "@/components/nav-user";
import { etiquettes } from "@/components/big-calendar";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import SidebarCalendar from "@/components/sidebar-calendar";
import { Checkbox } from "@/components/ui/checkbox";

const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "",
  },
};


/**
 * # AppSidebar
 * カレンダーアプリのサイドバーコンポーネント。
 *
 * - ヘッダー：ロゴ、サイドバートリガー
 * - フッター：ユーザー情報（`NavUser`）
 * - 本文：
 *   - ミニカレンダー（`SidebarCalendar`）
 *   - カレンダー一覧（`etiquettes` のトグル表示。チェックで色カテゴリの表示/非表示を切替）
 *
 * @remarks
 * - 表示/非表示の管理は `useCalendarContext()` の
 *   `isColorVisible(color)` / `toggleColorVisibility(color)` を利用。
 * - ラベル横の小さな丸は `--event-color` で CSS カスタムプロパティを渡し、テーマ色を反映。
 *
 * @param props - `Sidebar` にそのまま渡すスタイル/動作プロップス
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isColorVisible, toggleColorVisibility } = useCalendarContext();

  return (
    <Sidebar variant="inset" {...props} className="max-lg:p-3 lg:pe-1">
      {/* ヘッダー：ブランドと開閉トリガー */}
      <SidebarHeader>
        <div className="flex justify-between items-center gap-2">
          <Link className="inline-flex" href="/">
            <span className="sr-only">Logo</span>
            {/* シンプルな SVG ロゴ（色は現行テーマの中間色に合わせている） */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
            >
              <path
                fill="#52525C"
                d="m10.661.863-2.339 1.04 5.251 11.794L1.521 9.072l-.918 2.39 12.053 4.627-11.794 5.25 1.041 2.34 11.794-5.252L9.071 30.48l2.39.917 4.626-12.052 5.251 11.793 2.339-1.04-5.251-11.795 12.052 4.627.917-2.39-12.052-4.627 11.794-5.25-1.041-2.34-11.794 5.252L22.928 1.52l-2.39-.917-4.626 12.052L10.662.863Z"
              />
              <path
                fill="#F4F4F5"
                d="M17.28 0h-2.56v12.91L5.591 3.78l-1.81 1.81 9.129 9.129H0v2.56h12.91L3.78 26.409l1.81 1.81 9.129-9.129V32h2.56V19.09l9.128 9.129 1.81-1.81-9.128-9.129H32v-2.56H19.09l9.129-9.129-1.81-1.81-9.129 9.129V0Z"
              />
            </svg>
          </Link>
          <SidebarTrigger className="text-muted-foreground/80 hover:text-foreground/80 hover:bg-transparent!" />
        </div>
      </SidebarHeader>

      {/* コンテンツ：ミニカレンダー、カレンダー（色カテゴリ）リスト */}
      <SidebarContent className="gap-0 mt-3 pt-3 border-t">
        {/* ミニカレンダー */}
        <SidebarGroup className="px-1">
          <SidebarCalendar />
        </SidebarGroup>

        {/* カレンダー（色カテゴリ）トグル */}
        <SidebarGroup className="px-1 mt-3 pt-4 border-t">
          <SidebarGroupLabel className="uppercase text-muted-foreground/65">
            Calendars
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {etiquettes.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    className="relative rounded-md [&>svg]:size-auto justify-between has-focus-visible:border-ring has-focus-visible:ring-ring/50 has-focus-visible:ring-[3px]"
                  >
                    {/* ボタン内：チェックボックス + ラベル + 色ドット */}
                    <span>
                      <span className="font-medium flex items-center justify-between gap-3">
                        {/* 視覚的にはアイコンでオン/オフ表示。入力は非表示の Checkbox が持つ */}
                        <Checkbox
                          id={item.id}
                          className="sr-only peer"
                          checked={isColorVisible(item.color)}
                          onCheckedChange={() =>
                            toggleColorVisibility(item.color)
                          }
                        />
                        {/* チェック状態のときだけ表示するチェックアイコン */}
                        <RiCheckLine
                          className="peer-not-data-[state=checked]:invisible"
                          size={16}
                          aria-hidden="true"
                        />
                        {/* ラベル。未チェック時は取り消し線＋淡色化 */}
                        <label
                          htmlFor={item.id}
                          className="peer-not-data-[state=checked]:line-through peer-not-data-[state=checked]:text-muted-foreground/65 after:absolute after:inset-0"
                        >
                          {item.name}
                        </label>
                      </span>

                      {/* カラードット：CSS 変数で色を注入（--color-<name>-400 を想定） */}
                      <span
                        className="size-1.5 rounded-full bg-(--event-color)"
                        style={
                          {
                            "--event-color": `var(--color-${item.color}-400)`,
                          } as React.CSSProperties
                        }
                      ></span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* フッター：ユーザー情報 */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
