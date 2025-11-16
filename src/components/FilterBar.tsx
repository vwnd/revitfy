import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";

export function FilterBar() {
  return (
    <div className="flex flex-wrap gap-4 items-center p-6 bg-card rounded-lg">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="What Do You Want To Play?"
          className="pl-10 bg-secondary border-border"
        />
      </div>

      <Select defaultValue="all">
        <SelectTrigger className="w-[150px] bg-secondary">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          <SelectItem value="tower-a">Tower A</SelectItem>
          <SelectItem value="campus-b">Campus B</SelectItem>
          <SelectItem value="residential">Residential</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all">
        <SelectTrigger className="w-[150px] bg-secondary">
          <SelectValue placeholder="Office" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Offices</SelectItem>
          <SelectItem value="ny">New York</SelectItem>
          <SelectItem value="sf">San Francisco</SelectItem>
          <SelectItem value="london">London</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all">
        <SelectTrigger className="w-[150px] bg-secondary">
          <SelectValue placeholder="Area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Areas</SelectItem>
          <SelectItem value="structural">Structural</SelectItem>
          <SelectItem value="mep">MEP</SelectItem>
          <SelectItem value="architectural">Architectural</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" className="gap-2">
        <Filter className="w-4 h-4" />
        More Filters
      </Button>
    </div>
  );
}
