import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { AddIngredientDialog } from "./add-ingredient-dialog";
import {
  AdjustStockDialog,
  DeleteIngredientButton,
  EditIngredientDialog,
} from "./ingredient-row-actions";

export default async function InventoryPage() {
  const clientId = await requireCurrentClientId();
  const ingredients = await prisma.ingredient.findMany({
    where: { clientId },
    orderBy: { name: "asc" },
  });

  const lowStockCount = ingredients.filter(
    (i) => Number(i.quantityInStock) <= Number(i.reorderLevel),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Raw material stock, reorder levels and purchase cost.
            {lowStockCount > 0 && (
              <span className="text-destructive font-medium">
                {" "}
                {lowStockCount} ingredient{lowStockCount > 1 ? "s" : ""} low on stock.
              </span>
            )}
          </p>
        </div>
        <AddIngredientDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>In stock</TableHead>
                <TableHead>Reorder level</TableHead>
                <TableHead>Cost/unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ingredient) => {
                const isLow =
                  Number(ingredient.quantityInStock) <= Number(ingredient.reorderLevel);
                return (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>
                      {Number(ingredient.quantityInStock).toFixed(2)} {ingredient.unit}
                    </TableCell>
                    <TableCell>
                      {Number(ingredient.reorderLevel).toFixed(2)} {ingredient.unit}
                    </TableCell>
                    <TableCell>{formatCurrency(ingredient.costPerUnit.toString())}</TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="destructive">Low stock</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <AdjustStockDialog ingredientId={ingredient.id} unit={ingredient.unit} />
                        <EditIngredientDialog
                          ingredientId={ingredient.id}
                          reorderLevel={ingredient.reorderLevel.toString()}
                          costPerUnit={ingredient.costPerUnit.toString()}
                        />
                        <DeleteIngredientButton ingredientId={ingredient.id} name={ingredient.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {ingredients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No ingredients tracked yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
