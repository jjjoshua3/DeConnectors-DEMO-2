import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { posts as seedPosts, type Post } from "@/data/blog";
import { getPublicPosts } from "@/lib/cms.functions";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
});

function BlogIndex() {
  const [posts, setPosts] = useState<Array<Pick<Post, "slug" | "title" | "month" | "day" | "year" | "excerpt" | "image">>>(seedPosts);

  useEffect(() => {
    let live = true;
    getPublicPosts()
      .then((rows) => {
        if (live) setPosts(rows);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="site">
      <SiteHeader page="blog" />
      <main className="main">
        <section className="pad">
          <div className="wrap">
            <h1 className="page-title">Blog</h1>
            <div className="blog-list">
              {posts.map((post) => (
                <Link key={post.slug} to="/blog/$slug" params={{ slug: post.slug }} className="blog-entry">
                  <span className="blog-thumb">
                    <img src={post.image} alt="" />
                    <span className="date-badge">
                      <span className="mo">{post.month}</span>
                      <span className="d">{post.day}</span>
                      <span className="y">{post.year}</span>
                    </span>
                  </span>
                  <span className="blog-copy">
                    <h2>{post.title}</h2>
                    <p>{post.excerpt}</p>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
