
export default function OrderTableHeader() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-gray-100 text-gray-600 font-medium text-sm">
      <div className="col-span-1">OS</div>
      <div className="col-span-3">Título</div>
      <div className="col-span-2">Cliente</div>
      <div className="col-span-4">Status</div>
      <div className="col-span-2">Datas</div>
    </div>
  );
}
