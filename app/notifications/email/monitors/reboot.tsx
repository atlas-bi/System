import { Button } from '@react-email/button';
import { Html } from '@react-email/html';
import { Head } from '@react-email/head';
import { Preview } from '@react-email/preview';
import { Link } from '@react-email/link';
import { Tailwind } from '@react-email/tailwind';
import { Text } from '@react-email/text';
import { Monitor } from '~/models/monitor.server';
import { Body } from '@react-email/body';
import { Container } from '@react-email/container';
import { Section } from '@react-email/section';
import { Heading } from '@react-email/heading';
import { Hr } from '@react-email/hr';
import { Header } from '../helpers';

export const SuccessEmail = ({
	hostname,
	monitor,
}: {
	hostname?: string;
	monitor: Monitor;
}) => {
	const title = `${monitor.name || monitor.title} reboot time changed.`;
	return (
		<Html lang="en" dir="ltr">
			<Head>
				<title>{title}</title>
			</Head>

			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans">
					<Preview>{title}</Preview>
					<Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
						<Header hostname={hostname} />

						<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
							<strong>{monitor.name || monitor.title}</strong> reboot time
							changed.
						</Heading>

						<Section className="text-center mt-[32px] mb-[32px]">
							<Button
								pX={20}
								pY={12}
								className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center"
								href={`${hostname}/${monitor.type}/${monitor.id}`}
							>
								View Monitor
							</Button>
						</Section>

						<Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
						<Link
							className="text-[#666666] text-[12px] leading-[24px]"
							href={`${hostname}/${monitor.type}/${monitor.id}/notifications`}
						>
							Manage notifications.
						</Link>
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							<strong>© Atlas System {new Date().getFullYear()}</strong>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
