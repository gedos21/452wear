CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"brand" text,
	"model" text,
	"fit" text,
	"price" integer NOT NULL,
	"compare_at_price" integer,
	"currency" text DEFAULT 'TRY' NOT NULL,
	"images" jsonb NOT NULL,
	"colors" jsonb NOT NULL,
	"is_new" boolean DEFAULT false NOT NULL,
	"complementary_ids" jsonb,
	"related_ids" jsonb,
	"durum" text DEFAULT 'yayinda' NOT NULL,
	"sira" integer NOT NULL,
	"tohum" boolean DEFAULT false NOT NULL,
	"cope_atildi" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_redirect" (
	"slug" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"size" text NOT NULL,
	"color" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"sira" integer NOT NULL,
	CONSTRAINT "product_variant_stock_nonneg" CHECK ("product_variant"."stock" >= 0)
);
--> statement-breakpoint
ALTER TABLE "product_redirect" ADD CONSTRAINT "product_redirect_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_durum_idx" ON "product" USING btree ("durum");--> statement-breakpoint
CREATE INDEX "product_variant_product_idx" ON "product_variant" USING btree ("product_id");