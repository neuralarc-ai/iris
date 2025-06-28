import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-69px)] flex flex-col justify-between bg-cover bg-center" style={{ backgroundImage: 'url(/images/404-bg.png)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-[60px]" style={{ background: 'rgba(0,0,0,0.18)' }}>
        <h1 className="text-white text-5xl md:text-6xl font-headline font-bold drop-shadow-lg">Looks like this page wandered off.</h1>
        <p className="text-white text-lg md:text-2xl max-w-3xl drop-shadow-md">
          But don&apos;t worry we&apos;re already on it. Our team (and maybe a few smart AIs) are working behind the scenes to get things back on track.
        </p>
        <Link href="/">
          <button className="bg-[#232323] hover:bg-[#282828] text-white text-lg h-[72px] w-[235px] px-8 py-3 rounded-sm font-semibold shadow-lg transition-colors">Back to home</button>
        </Link>
      </div>
    </div>
  );
} 