import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { CategoryDialog } from "./category-dialog";
import { ItemDialog } from "./item-dialog";
import { AvailabilityToggle, DeleteItemButton } from "./item-row-actions";

export default async function MenuPage() {
  const clientId = await requireCurrentClientId();
  const categories = await prisma.menuCategory.findMany({
    where: { clientId },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { name: "asc" },
        include: { variants: { orderBy: { price: "asc" } } },
      },
    },
  });

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Menu Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage categories, items, pricing variants and availability.
          </p>
        </div>
        <div className="flex gap-2">
          <CategoryDialog />
          <ItemDialog categories={categoryOptions} />
        </div>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No categories yet. Create one to start adding menu items.
        </p>
      )}

      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{category.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {category.items.length} items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {category.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items in this category yet.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{item.name}</p>
                        {item.isSeasonal && <Badge variant="secondary">Seasonal</Badge>}
                        {!item.isAvailable && <Badge variant="destructive">Unavailable</Badge>}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap mt-1">
                        {item.variants.map((v) => (
                          <Badge key={v.id} variant="outline">
                            {v.name}: {formatCurrency(v.price.toString())}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AvailabilityToggle itemId={item.id} isAvailable={item.isAvailable} />
                      <ItemDialog
                        categories={categoryOptions}
                        item={{
                          id: item.id,
                          name: item.name,
                          description: item.description,
                          categoryId: item.categoryId,
                          costPrice: item.costPrice.toString(),
                          isSeasonal: item.isSeasonal,
                          variants: item.variants.map((v) => ({
                            name: v.name,
                            price: Number(v.price),
                          })),
                        }}
                      />
                      <DeleteItemButton itemId={item.id} itemName={item.name} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
