export const RouteLoading = ({ fullScreen = false }: { fullScreen?: boolean }) => (
  <div className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[60vh]"}`}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export default RouteLoading;
