"use client";

import { Comments, type CommentItem } from "@/components/kit/comments";

const THREAD: CommentItem[] = [
  {
    id: "1",
    author: { name: "Sekar Ayu" },
    time: "2h",
    body: "The new pricing layout reads much better. Could we move the yearly toggle above the cards?",
    likes: 3,
    replies: [
      { id: "1a", author: { name: "Dimas Arya" }, time: "1h", body: "Agreed. I'll try it on the staging build.", likes: 1 },
      { id: "1b", author: { name: "Rani Pratama" }, time: "45m", body: "Keep it sticky on mobile too, please.", likes: 0 },
    ],
  },
  {
    id: "2",
    author: { name: "Bima Santoso" },
    time: "20m",
    body: "Copy is final from my side. Shipping Thursday.",
    likes: 5,
    liked: true,
  },
];

export default function CommentsDemo() {
  return (
    <div className="flex min-h-[480px] w-full items-center justify-center p-4 sm:p-8">
      <Comments defaultComments={THREAD} currentUser={{ name: "Rani Pratama" }} />
    </div>
  );
}
