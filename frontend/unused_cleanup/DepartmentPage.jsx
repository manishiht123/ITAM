import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockDepartments = [
  { id: 1, name: "IT", code: "IT01", manager: "Rahul S", employees: 25, assets: 120, entity: "OFB", status: "Active" },
  { id: 2, name: "HR", code: "HR02", manager: "Anita M", employees: 10, assets: 20, entity: "OXYZO", status: "Active" }
];

export default function DepartmentPage() {
  const [departments, setDepartments] = useState(mockDepartments);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    entity: "",
    manager: "",
    status: "Active",
    description: ""
  });

  const handleSave = () => {
    setDepartments([
      ...departments,
      {
        id: Date.now(),
        ...form,
        employees: 0,
        assets: 0
      }
    ]);
    setOpen(false);
    setForm({ name: "", code: "", entity: "", manager: "", status: "Active", description: "" });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Departments</h1>
        <Button onClick={() => setOpen(true)}>Add Department</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4">Total Departments<br /><strong>{departments.length}</strong></CardContent></Card>
        <Card><CardContent className="p-4">Employees<br /><strong>{departments.reduce((a, d) => a + d.employees, 0)}</strong></CardContent></Card>
        <Card><CardContent className="p-4">Assets<br /><strong>{departments.reduce((a, d) => a + d.assets, 0)}</strong></CardContent></Card>
        <Card><CardContent className="p-4">Active<br /><strong>{departments.filter(d => d.status === "Active").length}</strong></CardContent></Card>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Department</th>
              <th className="p-3">Code</th>
              <th className="p-3">Manager</th>
              <th className="p-3">Employees</th>
              <th className="p-3">Assets</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(dep => (
              <tr key={dep.id} className="border-t hover:bg-muted/50">
                <td className="p-3 font-medium">{dep.name}</td>
                <td className="p-3 text-center">{dep.code}</td>
                <td className="p-3 text-center">{dep.manager}</td>
                <td className="p-3 text-center">{dep.employees}</td>
                <td className="p-3 text-center">{dep.assets}</td>
                <td className="p-3 text-center">{dep.entity}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${dep.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {dep.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[420px]">
          <SheetHeader>
            <SheetTitle>Add Department</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <Input placeholder="Department Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Department Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />

            <Select value={form.entity} onValueChange={v => setForm({ ...form, entity: v })}>
              <SelectTrigger><SelectValue placeholder="Select Entity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OFB">OFB</SelectItem>
                <SelectItem value="OXYZO">OXYZO</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Department Manager" value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} />

            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <textarea
              className="w-full rounded-md border p-2 text-sm"
              rows={3}
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
