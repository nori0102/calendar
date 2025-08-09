import {
  RiExpandUpDownLine,
  RiUserLine,
  RiGroupLine,
  RiSparklingLine,
  RiLogoutCircleLine,
} from "@remixicon/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/**
 * サイドバー内に表示するユーザー情報＆メニュー
 * @param user ユーザーの名前・メール・アバター画像URL
 */
export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* ドロップダウンメニュー全体 */}
        <DropdownMenu>
          {/* トリガー部分（クリックで開く） */}
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&>svg]:size-5"
            >
              {/* ユーザーのアバター画像 */}
              <Avatar className="size-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">S</AvatarFallback>
              </Avatar>

              {/* ユーザー名 */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
              </div>

              {/* 開閉アイコン */}
              <RiExpandUpDownLine className="ml-auto size-5 text-muted-foreground/80" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* ドロップダウンの中身 */}
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) dark bg-sidebar"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-3 focus:bg-sidebar-accent">
                <RiUserLine
                  size={20}
                  className="size-5 text-muted-foreground/80"
                />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 focus:bg-sidebar-accent">
                <RiGroupLine
                  size={20}
                  className="size-5 text-muted-foreground/80"
                />
                Accounts
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 focus:bg-sidebar-accent">
                <RiSparklingLine
                  size={20}
                  className="size-5 text-muted-foreground/80"
                />
                Upgrade
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 focus:bg-sidebar-accent">
                <RiLogoutCircleLine
                  size={20}
                  className="size-5 text-muted-foreground/80"
                />
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
