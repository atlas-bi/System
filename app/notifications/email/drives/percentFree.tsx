import { Button } from '@react-email/button';
import { Html } from '@react-email/html';
import { Head } from '@react-email/head';
import { Preview } from '@react-email/preview';
import { Link } from '@react-email/link';
import { Tailwind } from '@react-email/tailwind';
import { Text } from '@react-email/text';
import { Drive, Monitor } from '~/models/monitor.server';
import { Body } from '@react-email/body';
import { Container } from '@react-email/container';
import { Section } from '@react-email/section';
import { Heading } from '@react-email/heading';
import { Hr } from '@react-email/hr';
import { Header } from '../helpers';

export const SuccessEmail = ({
	hostname,
	subject,
	monitor,
	drive,
}: {
	hostname?: string;
	subject: string;
	monitor: Monitor;
	drive: Drive;
}) => {
	return (
		<Html lang="en" dir="ltr">
			<Head>
				<title>{subject}</title>
			</Head>
			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans">
					<Preview>Percentage of free space now below limit.</Preview>
					<Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
						<Header hostname={hostname} />

						<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
							Percentage of free space now below limit on{' '}
							<strong>{monitor.name || monitor.title} {drive.name}</strong> drive
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

export const ErrorEmail = ({
	hostname,
	monitor,
	message,
	drive,
}: {
	hostname?: string;
	monitor: Monitor;
	message: string;
	drive: Drive,
}) => {
	return (
		<Html lang="en" dir="ltr">
			<Head>
				<title>{message || 'Free space limit exceeded.'}</title>
			</Head>

			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans">
					<Preview>{message || 'Free space limit exceeded.'}</Preview>
					<Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
						<Header hostname={hostname} />

						<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
							Percentage of free space limit exceeded on{' '}
							<strong>{monitor.name || monitor.title} {drive.name}</strong> drive.
						</Heading>
						{message && (
							<>
								<Text className="text-black text-[14px] leading-[24px]">
									Message:
								</Text>

								<Text className="text-black text-[14px] leading-[24px]">
									{message}
								</Text>
							</>
						)}

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
