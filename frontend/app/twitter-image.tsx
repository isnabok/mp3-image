import { ImageResponse } from "next/og";

import { SocialShare } from "@/app/social-share";
import { siteMessages } from "@/lib/i18n";

export const alt = "MP3 Tag Editor social preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <SocialShare
        title={siteMessages.header.title}
        description={siteMessages.meta.description}
      />
    ),
    size,
  );
}
