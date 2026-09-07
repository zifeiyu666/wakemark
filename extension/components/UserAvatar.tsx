import type { ExtensionUser } from "../lib/api";

export function UserAvatar({
  user,
  size = 26,
}: {
  user: ExtensionUser | null;
  size?: number;
}) {
  const initial = (user?.name?.trim()?.[0] || "?").toUpperCase();
  const style = {
    width: size,
    height: size,
  };

  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={user.name || "Account"}
        width={size}
        height={size}
        title={user.name || undefined}
        className="user-avatar"
        style={style}
      />
    );
  }

  return (
    <div
      title={user?.name || undefined}
      className="user-avatar user-avatar-fallback"
      style={style}
    >
      {initial}
    </div>
  );
}
