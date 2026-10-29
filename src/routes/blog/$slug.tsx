import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "../../components/site-header";
import { postBySlug, type Post } from "../../data/blog";
import { getPublicPost } from "../../lib/cms.functions";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const fallback = postBySlug(slug);
  const [post, setPost] = useState<Post | null>(fallback ?? null);
  const [ready, setReady] = useState(Boolean(fallback));

  useEffect(() => {
    let live = true;
    setReady(Boolean(postBySlug(slug)));
    setPost(postBySlug(slug) ?? null);
    getPublicPost({ data: slug })
      .then((row) => {
        if (!live) return;
        if (row) {
          setPost({
            slug: row.slug,
            title: row.title,
            month: row.month,
            day: row.day,
            year: row.year,
            excerpt: row.excerpt,
            image: row.image,
            html: row.html ?? "",
          });
        } else {
          setPost(null);
        }
        setReady(true);
      })
      .catch(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [slug]);

  return (
    <div className="site">
      <SiteHeader page="blog" />
      <main className="main">
        <article className="pad">
          <div className="wrap article">
            {post ? (
              <>
                <p className="back">
                  <Link to="/blog">Terug naar blog</Link>
                </p>
                <h1>{post.title}</h1>
                <p className="meta">
                  {post.day} {post.month} {post.year} · Stefanie Vermeulen
                </p>
                {post.image ? <img className="article-hero" src={post.image} alt="" /> : null}
                <div className="article-body" dangerouslySetInnerHTML={{ __html: post.html }} />
              </>
            ) : !ready ? (
              <p>Bericht laden…</p>
            ) : (
              <>
                <h1>Niet gevonden</h1>
                <p>
                  <Link to="/blog">Terug naar blog</Link>
                </p>
              </>
            )}
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
