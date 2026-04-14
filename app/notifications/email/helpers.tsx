import { Section } from '@react-email/section';
import { Link } from '@react-email/link';
import { Img } from '@react-email/img';

export const Header = ({ hostname }: { hostname?: string }) => (
	<Section className="mt-[32px]">
		<Link href={hostname} className="flex items-center justify-center">
			<Img
				src={`${hostname}/images/logo.png`}
				alt="logo"
				width="35"
				height="35"
			/>
			<h2 className="scroll-m-20 text-2xl font-medium transition-colors m-0 hover:text-slate-900 text-slate-700">
				<span className="mx-2 text-slate-300">/</span>
				system
			</h2>
		</Link>
	</Section>
);
