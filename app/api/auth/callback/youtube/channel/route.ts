import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accessToken = searchParams.get("access_token");

  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token" }, { status: 400 });
  }

  try {
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const channelData = await channelRes.json();

    if (!channelRes.ok) {
      return NextResponse.json({ error: channelData }, { status: 400 });
    }

    const channel = Array.isArray(channelData?.items) ? channelData.items[0] : null;

    if (!channel) {
      return NextResponse.json(
        { error: "No YouTube channel found for this Google account." },
        { status: 404 }
      );
    }

    const snippet = channel.snippet ?? {};
    const statistics = channel.statistics ?? {};
    const customUrl = typeof snippet.customUrl === "string" ? snippet.customUrl.trim() : "";
    const channelHandle = customUrl
      ? customUrl.startsWith("@")
        ? customUrl
        : `@${customUrl}`
      : snippet.title || "";

    return NextResponse.json({
      channel_id: channel.id ?? "",
      channel_title: snippet.title ?? "",
      channel_handle: channelHandle,
      description: snippet.description ?? "",
      thumbnail_url:
        snippet?.thumbnails?.high?.url ??
        snippet?.thumbnails?.medium?.url ??
        snippet?.thumbnails?.default?.url ??
        "",
      subscriber_count: Number(statistics.subscriberCount ?? 0),
      video_count: Number(statistics.videoCount ?? 0),
      view_count: Number(statistics.viewCount ?? 0),
    });
  } catch (err: any) {
    console.error("YouTube channel fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
