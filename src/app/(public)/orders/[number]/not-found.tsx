import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export default function OrderNotFound() {
  return (
    <div className="container-page py-20">
      <EmptyState
        icon={<ReceiptText />}
        title="Order not found"
        description="This order doesn't exist or belongs to a different account."
        action={
          <Button asChild>
            <Link href="/account">Go to my tickets</Link>
          </Button>
        }
      />
    </div>
  );
}
