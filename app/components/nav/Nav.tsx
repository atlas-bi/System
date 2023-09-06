import { Link } from '@remix-run/react';
import Image from 'remix-image';

import { Links } from './Links';
import { UserNav } from './UserNav';
import { Input } from '../ui/input';
import { Search } from './Search';

export default function Nav() {
	return (
		<div className="border-b">
			<div className="flex h-16 items-center px-4 container">
				<nav className="flex grow items-center justify-between space-x-4 lg:space-x-6 mx-6">
					<Link to="/" className="flex items-center -ml-6">
						<Image
							loaderUrl="/api/image"
							src="/images/logo.svg"
							responsive={[
								{
									size: {
										width: 35,
										height: 35,
									},
									maxWidth: 35,
								},
							]}
							dprVariants={[1, 3]}
						/>
						<h2 className="scroll-m-20 text-2xl font-medium transition-colors m-0 hover:text-slate-900 text-slate-700">
							<span className="mx-2 text-slate-300">/</span>
							system
						</h2>
					</Link>

					<div className="flex space-x-10">
						<div className="flex space-x-6 text-muted-foreground">
							<Links />
							<div className="w-full flex-1 md:w-auto md:flex-none">
								<Search />
							</div>
						</div>

						<div className="flex space-x-6">
							<UserNav />
						</div>
					</div>
				</nav>
			</div>
		</div>
	);
}
