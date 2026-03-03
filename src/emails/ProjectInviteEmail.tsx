import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ProjectInviteEmailProps {
    inviterEmail: string;
    targetEmail: string;
    projectName: string;
    role: string;
    inviteLink: string;
}

export const ProjectInviteEmail = ({
    inviterEmail,
    targetEmail,
    projectName,
    role,
    inviteLink,
}: ProjectInviteEmailProps) => {
    const previewText = `Join ${projectName} on Approva`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans my-auto mx-auto pt-8 px-2">
                    <Container className="border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] max-w-lg bg-white">
                        <Section className="mt-[32px]">
                            <Text className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                                <strong>Approva</strong> Project Invitation
                            </Text>
                            <Heading className="text-black text-[20px] font-normal text-center p-0 my-[30px] mx-0">
                                Join <strong>{projectName}</strong>
                            </Heading>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Hello!
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                <strong>{inviterEmail}</strong> has invited you to join their project <strong>{projectName}</strong> on Approva as a <strong>{role}</strong>.
                            </Text>
                            <Section className="text-center mt-[32px] mb-[32px]">
                                <Button
                                    className="bg-[#9333ea] rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                                    href={inviteLink}
                                >
                                    Accept Invitation
                                </Button>
                            </Section>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Or copy and paste this URL into your browser:{" "}
                                <a href={inviteLink} className="text-blue-600 no-underline">
                                    {inviteLink}
                                </a>
                            </Text>
                            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                            <Text className="text-[#666666] text-[12px] leading-[24px]">
                                This invitation is intended for <span className="text-black">{targetEmail}</span>. If you were not expecting this invitation, you can ignore this email. Let us know if you have concerns.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ProjectInviteEmail;
