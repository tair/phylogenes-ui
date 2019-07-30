<template>
        <b-popover
        :target= target
        :title = title
        triggers="focus"
        :placement= placement
        >
        {{text}}
        </b-popover>
</template>

<script>
    export default {
        name: 'popover',
        props: [
                'text', 'title', 'target', 'placement'
        ],
        components: {

        },
        data() {
            return {}
        },
        computed: {},
        methods: {}
    }
</script>